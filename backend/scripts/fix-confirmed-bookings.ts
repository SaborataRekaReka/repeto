import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const confirmed = await prisma.bookingRequest.findMany({
    where: { status: 'CONFIRMED' },
    include: {
      user: { select: { id: true, subjectDetails: true } },
    },
  });

  console.log(`Found ${confirmed.length} confirmed booking(s)`);

  for (const booking of confirmed) {
    // Build scheduledAt
    const [hours, minutes] = booking.startTime.split(':').map(Number);
    const scheduledAt = new Date(booking.date);
    scheduledAt.setHours(hours, minutes, 0, 0);

    // Check if lesson already exists
    const existingLesson = await prisma.lesson.findFirst({
      where: { userId: booking.userId, scheduledAt, subject: booking.subject },
    });

    if (existingLesson) {
      console.log(`  SKIP: "${booking.clientName}" / ${booking.subject} — lesson already exists`);
      continue;
    }

    // Get rate from subjectDetails
    const details = (booking.user.subjectDetails as any[]) || [];
    const subjectInfo = details.find(
      (d) => d.name?.toLowerCase() === booking.subject.toLowerCase(),
    );
    const rate = Number(subjectInfo?.price) || 0;

    // Find or create student
    let student = await prisma.student.findFirst({
      where: {
        userId: booking.userId,
        name: booking.clientName,
        phone: booking.clientPhone,
      },
    });

    if (!student) {
      student = await prisma.student.create({
        data: {
          userId: booking.userId,
          name: booking.clientName,
          phone: booking.clientPhone,
          email: booking.clientEmail || undefined,
          subject: booking.subject,
          rate,
          status: 'ACTIVE',
        },
      });
      console.log(`  CREATED student: "${student.name}" (${student.id})`);
    } else {
      console.log(`  FOUND student: "${student.name}" (${student.id})`);
    }

    // Create lesson
    const lesson = await prisma.lesson.create({
      data: {
        userId: booking.userId,
        studentId: student.id,
        subject: booking.subject,
        scheduledAt,
        duration: booking.duration,
        rate,
        format: 'ONLINE',
        status: 'PLANNED',
      },
    });

    console.log(`  CREATED lesson: ${booking.subject} @ ${scheduledAt.toISOString()} (${lesson.id})`);
  }

  console.log('Done.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
