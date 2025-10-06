import {Injectable} from '@angular/core';

/**
 * Service responsible for managing keyboard shortcuts for table components.
 *
 * Features:
 * - Configurable keyboard shortcuts
 * - Smart input field detection (don't trigger shortcuts when typing)
 * - Event prevention and propagation control
 * - Reusable across different table components
 */
@Injectable({
  providedIn: 'root'
})
export class TableKeyboardService {
  /**
   * Build default keyboard shortcuts for table operations
   *
   * @param callbacks Object containing callback functions for each shortcut
   * @returns Array of keyboard shortcut configurations
   */
  buildDefaultShortcuts(callbacks: KeyboardShortcutCallbacks): KeyboardShortcut[] {
    return [
      {
        predicate: (event: KeyboardEvent) => event.ctrlKey && event.altKey && event.key.toLowerCase() === 'f',
        action: callbacks.focusGlobalFilter,
        preventDefault: true
      },
      {
        predicate: (event: KeyboardEvent) => event.ctrlKey && event.altKey && event.key.toLowerCase() === 'n',
        action: callbacks.openForm,
        preventDefault: true
      },
      {
        predicate: (event: KeyboardEvent) => event.ctrlKey && event.altKey && event.key.toLowerCase() === 'e',
        action: callbacks.exportExcel,
        preventDefault: true
      },
      {
        predicate: (event: KeyboardEvent) => event.ctrlKey && event.altKey && event.key.toLowerCase() === 'c',
        action: callbacks.openColumnToggle,
        preventDefault: true
      },
      {
        predicate: (event: KeyboardEvent) => event.ctrlKey && event.altKey && event.key.toLowerCase() === 'l',
        action: callbacks.clearGlobalFilter,
        preventDefault: true
      },
      {
        predicate: (event: KeyboardEvent) => !event.ctrlKey && !event.altKey && event.key === 'Delete',
        action: callbacks.deleteSelected,
        preventDefault: true
      }
    ];
  }

  /**
   * Handle keyboard event and execute matching shortcut
   *
   * @param event Keyboard event from document
   * @param shortcuts Array of configured shortcuts
   * @returns true if a shortcut was triggered, false otherwise
   */
  handleKeyboardEvent(event: KeyboardEvent, shortcuts: KeyboardShortcut[]): boolean {
    // Don't trigger shortcuts when user is typing in input/textarea
    // unless using modifier keys (Ctrl/Alt)
    if (this.isTypingInInputField(event)) {
      return false;
    }

    // Find and execute matching shortcut
    for (const shortcut of shortcuts) {
      if (shortcut.predicate(event)) {
        if (shortcut.preventDefault) {
          event.preventDefault();
          event.stopPropagation();
        }
        shortcut.action();
        return true;
      }
    }

    return false;
  }

  /**
   * Check if user is typing in an input field
   * Shortcuts with modifier keys (Ctrl/Alt) still work in input fields
   *
   * @param event Keyboard event
   * @returns true if typing in input field without modifiers
   */
  private isTypingInInputField(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement | null;
    const tagName = (target?.tagName || '').toLowerCase();

    // Allow shortcuts with Ctrl or Alt even in input fields
    if (event.ctrlKey || event.altKey) {
      return false;
    }

    // Block shortcuts when typing in input/textarea
    return ['input', 'textarea'].includes(tagName);
  }
}

/**
 * Interface for keyboard shortcut configuration
 */
export interface KeyboardShortcut {
  /** Function to test if this shortcut matches the event */
  predicate: (event: KeyboardEvent) => boolean;
  /** Function to execute when shortcut is triggered */
  action: () => void;
  /** Whether to prevent default behavior and stop propagation */
  preventDefault: boolean;
}

/**
 * Interface for callback functions used by default shortcuts
 */
export interface KeyboardShortcutCallbacks {
  /** Ctrl+Alt+F: Focus global filter input */
  focusGlobalFilter: () => void;
  /** Ctrl+Alt+N: Open form to create new item */
  openForm: () => void;
  /** Ctrl+Alt+E: Export to Excel */
  exportExcel: () => void;
  /** Ctrl+Alt+C: Open column toggle panel */
  openColumnToggle: () => void;
  /** Ctrl+Alt+L: Clear global filter */
  clearGlobalFilter: () => void;
  /** Delete: Delete selected items */
  deleteSelected: () => void;
}
