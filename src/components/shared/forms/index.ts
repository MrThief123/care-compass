/** UI-02 — Forms kit. Shared form patterns for all three dashboards. */
export { ChipGroup, type ChipGroupProps, type ChipOption } from "./chip-group";
export { ConfirmationModal, type ConfirmationModalProps } from "./confirmation-modal";
export { DetailsFormCard, type DetailsFormCardProps } from "./details-form-card";
export { EventForm, type EventFormProps, type EventFormValues } from "./event-form";
export { Field, type FieldOption, type FieldProps, type FieldType } from "./field";
export { InlineAlert, type InlineAlertProps } from "./inline-alert";
export { SettingsActionCard, type SettingsActionCardProps } from "./settings-action-card";
export { SidePanelForm, type SidePanelFormProps } from "./side-panel-form";
export {
  CUSTOM_SLOT,
  TIME_SLOTS,
  TimeSlotChips,
  customRangeError,
  type TimeSlotChipsProps,
  type TimeSlotValue,
} from "./time-slot-chips";
export {
  END_BEFORE_START,
  customTimeRangeSchema,
  fieldErrors,
  requiredText,
  timeSchema,
  type CustomTimeRange,
  type FieldErrors,
  type ValidationResult,
} from "./validation";
