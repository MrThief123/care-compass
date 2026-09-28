import { ChipGroup } from "@/components/shared/forms";

import { EDIT_SCOPE_OPTIONS, type EditScope } from "./edit-scope";

export interface EditScopeFieldsProps {
  value: EditScope;
  onChange: (value: EditScope) => void;
}

/**
 * PD-045: shown only for a recurring event (a one-off has nothing to choose
 * between — its one occurrence is its whole series). Edit event only.
 */
export function EditScopeFields({ value, onChange }: EditScopeFieldsProps) {
  return (
    <ChipGroup
      legend="Scope"
      value={value}
      onChange={(next) => onChange(next as EditScope)}
      options={EDIT_SCOPE_OPTIONS}
    />
  );
}
