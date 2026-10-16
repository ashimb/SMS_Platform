import { Input, type InputProps } from "@school-platform/ui";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Password field with a show/hide toggle. Works with password managers (correct autocomplete, a
 * real type="password" input) and lets users check what they typed (WCAG 3.3.8).
 */
export function PasswordInput(props: Omit<InputProps, "type" | "trailing">) {
  const { t } = useTranslation("auth");
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className="pr-11" spellCheck={false} />
      <button
        type="button"
        onClick={() => {
          setVisible((value) => !value);
        }}
        aria-pressed={visible}
        aria-label={visible ? t("password.hide") : t("password.show")}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-fg-subtle transition-colors hover:text-fg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {visible ? (
          <EyeOff aria-hidden="true" className="size-4" />
        ) : (
          <Eye aria-hidden="true" className="size-4" />
        )}
      </button>
    </div>
  );
}
