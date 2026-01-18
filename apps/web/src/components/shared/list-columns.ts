import type { ListHeaderColumn } from "./list-header";

/**
 * Centralized list column configurations for consistent list headers across all pages.
 * Each page can use the appropriate configuration based on its context.
 */

// Base columns shared across most pages
const NAME_COLUMN: ListHeaderColumn = { label: "Name" };
const OWNER_COLUMN: ListHeaderColumn = {
  label: "Owner",
  width: "w-10",
  align: "center",
  hideBelow: "sm",
};
const SIZE_COLUMN: ListHeaderColumn = {
  label: "Size",
  width: "w-24",
  align: "right",
  hideBelow: "sm",
};
const ACTIONS_COLUMN: ListHeaderColumn = { label: "", width: "w-8" };

// Date columns for different contexts
const MODIFIED_COLUMN: ListHeaderColumn = {
  label: "Modified",
  width: "w-32",
  align: "right",
  hideBelow: "md",
};
const ACCESSED_COLUMN: ListHeaderColumn = {
  label: "Accessed",
  width: "w-32",
  align: "right",
  hideBelow: "md",
};
const DELETED_COLUMN: ListHeaderColumn = {
  label: "Deleted",
  width: "w-32",
  align: "right",
  hideBelow: "md",
};
const SHARED_COLUMN: ListHeaderColumn = {
  label: "Shared",
  width: "w-32",
  align: "right",
  hideBelow: "md",
};

/**
 * Standard file list columns for Files page
 * Columns: Name | Owner | Size | Modified | Actions
 */
export const FILE_LIST_COLUMNS: ListHeaderColumn[] = [
  NAME_COLUMN,
  OWNER_COLUMN,
  SIZE_COLUMN,
  MODIFIED_COLUMN,
  ACTIONS_COLUMN,
];

/**
 * Starred page uses the same columns as Files page
 * Columns: Name | Owner | Size | Modified | Actions
 */
export const STARRED_LIST_COLUMNS = FILE_LIST_COLUMNS;

/**
 * Recent page columns - shows "Accessed" instead of "Modified"
 * Columns: Name | Owner | Size | Accessed | Actions
 */
export const RECENT_LIST_COLUMNS: ListHeaderColumn[] = [
  NAME_COLUMN,
  OWNER_COLUMN,
  SIZE_COLUMN,
  ACCESSED_COLUMN,
  ACTIONS_COLUMN,
];

/**
 * Trash page columns - shows checkbox, "Deleted" date, and wider actions
 * Columns: Checkbox | Name | Size | Deleted | Actions
 */
export const TRASH_LIST_COLUMNS: ListHeaderColumn[] = [
  { label: "", width: "w-8" }, // Checkbox column
  NAME_COLUMN,
  SIZE_COLUMN,
  DELETED_COLUMN,
  { label: "", width: "w-20" }, // Wider actions for restore/delete buttons
];

/**
 * Shared With Me page columns - shows owner with name visible
 * Columns: Name | Owner (with name) | Size | Shared | Actions
 */
export const SHARED_LIST_COLUMNS: ListHeaderColumn[] = [
  NAME_COLUMN,
  { label: "Owner", width: "w-40", align: "left", hideBelow: "sm" },
  { ...SIZE_COLUMN, hideBelow: "md" },
  { ...SHARED_COLUMN, hideBelow: "lg" },
  { label: "", width: "w-10" },
];

/**
 * Public Share page columns - readonly view with owner
 * Columns: Name | Owner | Size | Modified
 */
export const PUBLIC_SHARE_LIST_COLUMNS: ListHeaderColumn[] = [
  NAME_COLUMN,
  OWNER_COLUMN,
  SIZE_COLUMN,
  MODIFIED_COLUMN,
];
