import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import GravityLayout from '@/components/GravityLayout';
import { Card, Text, TextInput, Button, Loader, Switch } from '@gravity-ui/uikit';
import { useAuth } from '@/contexts/AuthContext';
import { resolveApiAssetUrl } from '@/lib/api';
import {
  useAdminTutors,
  useAdminTutorDetail,
  updateTutorVerification,
  updateTutorObjectVerification,
  type AdminTutorItem,
  type AdminTutorsFilter,
  type AdminTutorVerificationObjectType,
} from '@/hooks/useAdmin';

const FILTERS: Array<{ id: AdminTutorsFilter; label: string }> = [
  { id: 'all', label: 'Все' },
  { id: 'verified', label: 'Верифицированы' },
  { id: 'pending', label: 'Ожидают проверки' },
];

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Неизвестно';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<AdminTutorsFilter>('all');
  const [selectedTutorId, setSelectedTutorId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updatingObjectKey, setUpdatingObjectKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canViewAdmin = user?.role === 'admin';

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchDraft.trim());
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchDraft]);

  useEffect(() => {
    if (!loading && user && !canViewAdmin) {
      router.replace('/settings');
    }
  }, [loading, user, canViewAdmin, router]);

  const { data, loading: listLoading, error, refetch } = useAdminTutors({
    search,
    verified: filter,
  });

  const tutors = useMemo(() => data?.items || [], [data?.items]);

  useEffect(() => {
    if (tutors.length === 0) {
      setSelectedTutorId(null);
      return;
    }

    if (!selectedTutorId || !tutors.some((item) => item.id === selectedTutorId)) {
      setSelectedTutorId(tutors[0].id);
    }
  }, [tutors, selectedTutorId]);

  const {
    data: selectedTutor,
    loading: detailLoading,
    error: detailError,
    refetch: refetchDetail,
  } = useAdminTutorDetail(selectedTutorId);

  const handleToggleVerification = async (tutor: AdminTutorItem, nextValue: boolean) => {
    if (updatingId) {
      return;
    }

    setActionError(null);
    setUpdatingId(tutor.id);

    try {
      await updateTutorVerification(tutor.id, nextValue);
      await Promise.all([
        refetch(),
        selectedTutorId === tutor.id ? refetchDetail() : Promise.resolve(),
      ]);
    } catch (e: any) {
      setActionError(
        typeof e?.message === 'string' && e.message.trim().length > 0
          ? e.message
          : 'Не удалось изменить статус верификации',
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleObjectVerification = async (
    type: AdminTutorVerificationObjectType,
    objectId: string,
    nextValue: boolean,
  ) => {
    if (!selectedTutor || !selectedTutorId || updatingObjectKey) {
      return;
    }

    const key = `${type}:${objectId}`;
    setActionError(null);
    setUpdatingObjectKey(key);

    try {
      await updateTutorObjectVerification(selectedTutorId, {
        type,
        objectId,
        verified: nextValue,
      });
      await Promise.all([refetch(), refetchDetail()]);
    } catch (e: any) {
      setActionError(
        typeof e?.message === 'string' && e.message.trim().length > 0
          ? e.message
          : 'Не удалось изменить статус объекта',
      );
    } finally {
      setUpdatingObjectKey(null);
    }
  };

  return (
    <GravityLayout title="Админка">
      <div className="repeto-admin-page">
        <Card className="repeto-admin-head" view="outlined">
          <Text variant="header-1">Модерация верификации репетиторов</Text>
          <Text variant="body-2" color="secondary" style={{ display: 'block', marginTop: 8 }}>
            Управляйте значком «Верифицирован» для публичных профилей.
          </Text>

          <div className="repeto-admin-controls">
            <TextInput
              size="l"
              value={searchDraft}
              onUpdate={setSearchDraft}
              placeholder="Поиск по имени или email"
            />
            <div className="repeto-admin-filters">
              {FILTERS.map((item) => (
                <Button
                  key={item.id}
                  view={filter === item.id ? 'action' : 'outlined'}
                  size="m"
                  onClick={() => setFilter(item.id)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          {actionError && (
            <Text
              variant="body-2"
              style={{ color: 'var(--g-color-text-danger)', marginTop: 12, display: 'block' }}
            >
              {actionError}
            </Text>
          )}
        </Card>

        <div className="repeto-admin-grid">
          <Card className="repeto-admin-list" view="outlined">
            {loading ? (
              <div className="repeto-admin-loader">
                <Loader size="m" />
              </div>
            ) : !canViewAdmin ? (
              <Text variant="body-2" color="secondary">
                Проверяем доступ...
              </Text>
            ) : listLoading && tutors.length === 0 ? (
              <div className="repeto-admin-loader">
                <Loader size="m" />
              </div>
            ) : error ? (
              <Text variant="body-2" style={{ color: 'var(--g-color-text-danger)' }}>
                {error.message || 'Не удалось загрузить список репетиторов'}
              </Text>
            ) : tutors.length === 0 ? (
              <Text variant="body-2" color="secondary">
                Репетиторы не найдены.
              </Text>
            ) : (
              <div className="repeto-admin-list__rows">
                {tutors.map((tutor) => {
                  const pending = updatingId === tutor.id;
                  const selected = selectedTutorId === tutor.id;

                  return (
                    <div
                      key={tutor.id}
                      className={`repeto-admin-row${selected ? ' repeto-admin-row--selected' : ''}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedTutorId(tutor.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedTutorId(tutor.id);
                        }
                      }}
                    >
                      <div className="repeto-admin-row__main">
                        <Text variant="subheader-2">{tutor.name}</Text>
                        <Text variant="body-2" color="secondary">
                          {tutor.email}
                        </Text>
                        <Text variant="caption-2" color="secondary">
                          Обновлено: {formatDate(tutor.updatedAt)}
                        </Text>
                        <Text variant="caption-2" color="secondary">
                          Образование: {tutor.educationVerifiedCount}/{tutor.educationTotal} · Опыт:{' '}
                          {tutor.experienceVerifiedCount}/{tutor.experienceTotal} · Документы:{' '}
                          {tutor.certificatesVerifiedCount}/{tutor.certificatesTotal}
                        </Text>
                      </div>
                      <div className="repeto-admin-row__actions">
                        <Switch
                          checked={tutor.qualificationVerified}
                          onUpdate={(value) => {
                            void handleToggleVerification(tutor, value);
                          }}
                          size="m"
                          disabled={pending}
                        />
                        <Text
                          variant="body-2"
                          style={{
                            color: tutor.qualificationVerified
                              ? 'var(--g-color-text-positive)'
                              : 'var(--g-color-text-secondary)',
                          }}
                        >
                          {tutor.qualificationVerified ? 'Верифицирован' : 'Не верифицирован'}
                        </Text>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="repeto-admin-detail" view="outlined">
            {!selectedTutorId ? (
              <Text variant="body-2" color="secondary">
                Выберите репетитора слева.
              </Text>
            ) : detailLoading && !selectedTutor ? (
              <div className="repeto-admin-loader">
                <Loader size="m" />
              </div>
            ) : detailError ? (
              <Text variant="body-2" style={{ color: 'var(--g-color-text-danger)' }}>
                {detailError.message || 'Не удалось загрузить детали репетитора'}
              </Text>
            ) : !selectedTutor ? (
              <Text variant="body-2" color="secondary">
                Данные репетитора недоступны.
              </Text>
            ) : (
              <div className="repeto-admin-detail__content">
                <div className="repeto-admin-detail__head">
                  <div>
                    <Text variant="header-1">{selectedTutor.name}</Text>
                    <Text variant="body-2" color="secondary" style={{ display: 'block', marginTop: 4 }}>
                      {selectedTutor.email}
                    </Text>
                    <Text variant="caption-2" color="secondary" style={{ display: 'block', marginTop: 4 }}>
                      Последнее обновление: {formatDate(selectedTutor.updatedAt)}
                    </Text>
                  </div>
                  <div className="repeto-admin-detail__head-toggle">
                    <Switch
                      checked={selectedTutor.qualificationVerified}
                      onUpdate={(value) => {
                        const listItem = tutors.find((item) => item.id === selectedTutor.id);
                        if (listItem) {
                          void handleToggleVerification(listItem, value);
                        }
                      }}
                      size="m"
                      disabled={updatingId === selectedTutor.id}
                    />
                    <Text
                      variant="body-2"
                      style={{
                        color: selectedTutor.qualificationVerified
                          ? 'var(--g-color-text-positive)'
                          : 'var(--g-color-text-secondary)',
                      }}
                    >
                      Общий статус: {selectedTutor.qualificationVerified ? 'Верифицирован' : 'Не верифицирован'}
                    </Text>
                  </div>
                </div>

                <div className="repeto-admin-detail__section">
                  <Text variant="subheader-2">Публичная информация</Text>
                  <Text variant="body-2" style={{ marginTop: 8 }}>
                    Ссылка: {selectedTutor.slug ? `/t/${selectedTutor.slug}` : 'не задана'}
                  </Text>
                  <Text variant="body-2" style={{ marginTop: 4 }}>
                    Страница: {selectedTutor.published ? 'Опубликована' : 'Не опубликована'}
                  </Text>
                  <Text variant="body-2" style={{ marginTop: 4 }}>
                    Формат: {selectedTutor.format || 'не указан'}
                  </Text>
                  <Text variant="body-2" style={{ marginTop: 4 }}>
                    Телефон: {selectedTutor.phone || 'не указан'}
                  </Text>
                  <Text variant="body-2" style={{ marginTop: 4 }}>
                    WhatsApp: {selectedTutor.whatsapp || 'не указан'}
                  </Text>
                  <Text variant="body-2" style={{ marginTop: 4 }}>
                    VK: {selectedTutor.vk || 'не указан'}
                  </Text>
                  <Text variant="body-2" style={{ marginTop: 4 }}>
                    Сайт: {selectedTutor.website || 'не указан'}
                  </Text>
                  {selectedTutor.offlineAddress && (
                    <Text variant="body-2" style={{ marginTop: 4 }}>
                      Адрес (очно): {selectedTutor.offlineAddress}
                    </Text>
                  )}
                  <Text variant="body-2" style={{ marginTop: 8 }}>
                    Предметы: {selectedTutor.subjects.length > 0 ? selectedTutor.subjects.join(', ') : 'не указаны'}
                  </Text>
                  {selectedTutor.tagline && (
                    <Text variant="body-2" style={{ marginTop: 8 }}>
                      Подзаголовок: {selectedTutor.tagline}
                    </Text>
                  )}
                  {selectedTutor.aboutText && (
                    <Text variant="body-2" style={{ marginTop: 8, whiteSpace: 'pre-line' }}>
                      О себе: {selectedTutor.aboutText}
                    </Text>
                  )}
                </div>

                <div className="repeto-admin-detail__section">
                  <Text variant="subheader-2">
                    Образование ({selectedTutor.totals.educationVerified}/{selectedTutor.totals.education})
                  </Text>
                  {selectedTutor.education.length === 0 ? (
                    <Text variant="body-2" color="secondary" style={{ marginTop: 8 }}>
                      Нет данных об образовании.
                    </Text>
                  ) : (
                    <div className="repeto-admin-atom-list">
                      {selectedTutor.education.map((entry) => {
                        const key = `education:${entry.id}`;
                        const pending = updatingObjectKey === key;
                        return (
                          <div key={entry.id} className="repeto-admin-atom-row">
                            <div className="repeto-admin-atom-row__main">
                              <Text variant="body-2" style={{ fontWeight: 600 }}>
                                {entry.institution}
                              </Text>
                              {entry.program && (
                                <Text variant="body-2" color="secondary">
                                  {entry.program}
                                </Text>
                              )}
                              {entry.years && (
                                <Text variant="caption-2" color="secondary">
                                  {entry.years}
                                </Text>
                              )}
                            </div>
                            <Switch
                              checked={entry.verified}
                              onUpdate={(value) => {
                                void handleToggleObjectVerification('education', entry.id, value);
                              }}
                              disabled={pending}
                              size="m"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="repeto-admin-detail__section">
                  <Text variant="subheader-2">
                    Опыт ({selectedTutor.totals.experienceVerified}/{selectedTutor.totals.experience})
                  </Text>
                  {selectedTutor.experienceLines.length === 0 ? (
                    <Text variant="body-2" color="secondary" style={{ marginTop: 8 }}>
                      Нет строк опыта.
                    </Text>
                  ) : (
                    <div className="repeto-admin-atom-list">
                      {selectedTutor.experienceLines.map((entry) => {
                        const key = `experience:${entry.id}`;
                        const pending = updatingObjectKey === key;

                        return (
                          <div key={entry.id} className="repeto-admin-atom-row">
                            <div className="repeto-admin-atom-row__main">
                              <Text variant="body-2">{entry.text}</Text>
                            </div>
                            <Switch
                              checked={entry.verified}
                              onUpdate={(value) => {
                                void handleToggleObjectVerification('experience', entry.id, value);
                              }}
                              disabled={pending}
                              size="m"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="repeto-admin-detail__section">
                  <Text variant="subheader-2">
                    Документы ({selectedTutor.totals.certificatesVerified}/{selectedTutor.totals.certificates})
                  </Text>
                  {selectedTutor.certificates.length === 0 ? (
                    <Text variant="body-2" color="secondary" style={{ marginTop: 8 }}>
                      Нет загруженных документов.
                    </Text>
                  ) : (
                    <div className="repeto-admin-atom-list">
                      {selectedTutor.certificates.map((entry) => {
                        const key = `certificates:${entry.id}`;
                        const pending = updatingObjectKey === key;
                        const fileUrl = resolveApiAssetUrl(entry.fileUrl) || entry.fileUrl;

                        return (
                          <div key={entry.id} className="repeto-admin-atom-row">
                            <div className="repeto-admin-atom-row__main">
                              <Text variant="body-2" style={{ fontWeight: 600 }}>
                                {entry.title}
                              </Text>
                              <Text variant="caption-2" color="secondary">
                                Загрузка: {formatDate(entry.uploadedAt)}
                              </Text>
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="repeto-admin-file-link"
                              >
                                Открыть файл
                              </a>
                            </div>
                            <Switch
                              checked={entry.verified}
                              onUpdate={(value) => {
                                void handleToggleObjectVerification('certificates', entry.id, value);
                              }}
                              disabled={pending}
                              size="m"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </GravityLayout>
  );
}
