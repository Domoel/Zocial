import { updateCredentials } from '../_api/updateCredentials.js'
import { store } from '../_store/store.js'

// Update the current user's profile via PATCH /accounts/update_credentials and refresh the
// store so the profile re-renders without a page reload.
export async function updateProfile ({ displayName, note, fields, avatarFile, headerFile }) {
  const { currentInstance, accessToken } = store.get()

  const formData = new FormData()
  formData.append('display_name', displayName == null ? '' : displayName)
  formData.append('note', note == null ? '' : note)
  // Sending fields_attributes replaces ALL metadata fields, so we send every slot (including
  // empty ones) — that's how removed fields get cleared server-side.
  ;(fields || []).forEach((field, i) => {
    formData.append(`fields_attributes[${i}][name]`, field.name || '')
    formData.append(`fields_attributes[${i}][value]`, field.value || '')
  })
  // Only send images the user actually picked, so we don't needlessly re-upload existing ones.
  if (avatarFile) {
    formData.append('avatar', avatarFile)
  }
  if (headerFile) {
    formData.append('header', headerFile)
  }

  const updated = await updateCredentials(currentInstance, accessToken, formData)

  // Live update: refresh both the cached credentials and the currently displayed profile.
  store.runIfLoggedIn(currentInstance, ({ verifyCredentials }) => {
    store.set({
      verifyCredentials: Object.assign({}, verifyCredentials, { [currentInstance]: updated }),
      currentAccountProfile: updated
    })
  })

  return updated
}
