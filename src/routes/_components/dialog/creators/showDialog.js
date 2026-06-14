import { createDialogElement } from '../helpers/createDialogElement.js'
import { createDialogId } from '../helpers/createDialogId.js'
import { on } from '../../../_utils/eventBus.ts'
import { store } from '../../../_store/store.js'

export function showDialog (Dialog, data) {
  const id = createDialogId()
  const target = createDialogElement()
  data.id = id
  // Dialogs are created imperatively (not as children of the root _layout), so they don't inherit
  // the store via the component tree. Pass it explicitly so $-store access (e.g. the reactive
  // $messages i18n map used in dialog templates) works — otherwise this.store is undefined and
  // rendering throws.
  const dialog = new Dialog({
    target,
    data,
    store
  })
  on('destroyDialog', dialog, function (thisId) {
    if (id !== thisId) {
      return
    }
    target.remove()
    this.destroy()
  })
  dialog.show()
  return dialog
}
