import { Dialog } from "@gravity-ui/uikit";
import type { CSSProperties, ReactNode } from "react";

type AppDialogProps = {
    open: boolean;
    onClose: () => void;
    size?: "s" | "m" | "l" | "xl";
    caption?: ReactNode;
    hasCloseButton?: boolean;
    children: ReactNode;
    bodyClassName?: string;
    bodyStyle?: CSSProperties;
    footer?: any;
};

const GDialog = Dialog as any;

const AppDialog = ({
    open,
    onClose,
    size = "m",
    caption,
    hasCloseButton,
    children,
    bodyClassName,
    bodyStyle,
    footer,
}: AppDialogProps) => {
    const footerProps = footer
        ? (() => {
              const normalizedFooter: any = { ...footer };
              const entityActions = normalizedFooter.entityActions;
              delete normalizedFooter.entityActions;

              const hasCustomRenderer = Boolean(normalizedFooter.renderButtons);
              const isCloseOnlyFooter =
                  !hasCustomRenderer &&
                  !normalizedFooter.textButtonApply &&
                  normalizedFooter.textButtonCancel;

              // Some dialogs provide only cancel text; map it to the primary slot to avoid an empty action button.
              if (isCloseOnlyFooter) {
                  normalizedFooter.textButtonApply = normalizedFooter.textButtonCancel;
                  normalizedFooter.onClickButtonApply =
                      normalizedFooter.onClickButtonCancel || onClose;

                  normalizedFooter.propsButtonApply = {
                      view: "outlined",
                      ...(normalizedFooter.propsButtonCancel || {}),
                      ...(normalizedFooter.propsButtonApply || {}),
                  };

                  delete normalizedFooter.textButtonCancel;
                  delete normalizedFooter.onClickButtonCancel;
                  delete normalizedFooter.propsButtonCancel;
              }

              if (normalizedFooter.textButtonApply) {
                  normalizedFooter.propsButtonApply = {
                      view: isCloseOnlyFooter ? "outlined" : "action",
                      size: "l",
                      ...(normalizedFooter.propsButtonApply || {}),
                  };
              }

              if (normalizedFooter.textButtonCancel) {
                  normalizedFooter.propsButtonCancel = {
                      view: "outlined",
                      size: "l",
                      ...(normalizedFooter.propsButtonCancel || {}),
                  };
              }

              if (entityActions) {
                  const existingChildren = normalizedFooter.children;
                  normalizedFooter.children = (
                      <div className="repeto-modal-entity-actions">
                          {entityActions}
                          {existingChildren}
                      </div>
                  );
              }

              normalizedFooter.renderButtons =
                  normalizedFooter.renderButtons ||
                  ((buttonApply: ReactNode, buttonCancel: ReactNode) => (
                      <div className="repeto-modal-actions-right">
                          {buttonCancel}
                          {buttonApply}
                      </div>
                  ));

              return normalizedFooter;
          })()
        : null;

    const bodyClass = bodyClassName
        ? `repeto-dialog-body-scroll ${bodyClassName}`
        : "repeto-dialog-body-scroll";

    return (
        <GDialog
            open={open}
            onClose={onClose}
            size={size}
            hasCloseButton={hasCloseButton}
            contentOverflow="visible"
            className="repeto-app-dialog"
            modalClassName="repeto-app-dialog-modal"
        >
            {caption !== undefined && <GDialog.Header caption={caption} />}
            <GDialog.Body>
                <div className={bodyClass} style={bodyStyle}>
                    {children}
                </div>
            </GDialog.Body>
            {footerProps && <GDialog.Footer {...footerProps} />}
        </GDialog>
    );
};

export default AppDialog;
