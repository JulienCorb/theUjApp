/* eslint-disable */
/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */
/** @typedef {{}} Auth_Forgot_Password_LinkInputs */
/** @typedef {{}} Auth_Login_LinkInputs */
/** @typedef {{}} Auth_Login_PromptInputs */
/** @typedef {{}} Dashboard_EmailInputs */
/** @typedef {{}} Dashboard_Logged_InInputs */
/** @typedef {{}} Dashboard_Member_SinceInputs */
/** @typedef {{}} Dashboard_TitleInputs */
/** @typedef {{}} Error_Too_Many_RequestsInputs */
/** @typedef {{}} Field_EmailInputs */
/** @typedef {{}} Field_PasswordInputs */
/** @typedef {{}} Field_Password_ConfirmationInputs */
/** @typedef {{}} Field_Password_HintInputs */
/** @typedef {{}} Forgot_Password_Back_To_LoginInputs */
/** @typedef {{}} Forgot_Password_SubmitInputs */
/** @typedef {{}} Forgot_Password_Submit_PendingInputs */
/** @typedef {{}} Forgot_Password_SubtitleInputs */
/** @typedef {{}} Forgot_Password_SuccessInputs */
/** @typedef {{}} Forgot_Password_TitleInputs */
/** @typedef {{}} Login_SubmitInputs */
/** @typedef {{}} Login_Submit_PendingInputs */
/** @typedef {{}} Login_SubtitleInputs */
/** @typedef {{}} Login_TitleInputs */
/** @typedef {{}} Logout_SubmitInputs */
/** @typedef {{}} Logout_Submit_PendingInputs */
/** @typedef {{}} Reset_Password_Back_To_LoginInputs */
/** @typedef {{}} Reset_Password_Invalid_TokenInputs */
/** @typedef {{}} Reset_Password_SubmitInputs */
/** @typedef {{}} Reset_Password_Submit_PendingInputs */
/** @typedef {{}} Reset_Password_SubtitleInputs */
/** @typedef {{}} Reset_Password_SuccessInputs */
/** @typedef {{}} Reset_Password_TitleInputs */


export const auth_forgot_password_link = /** @type {(inputs: Auth_Forgot_Password_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mot de passe oublié ?`)
};

export const auth_login_link = /** @type {(inputs: Auth_Login_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se connecter`)
};

export const auth_login_prompt = /** @type {(inputs: Auth_Login_PromptInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous avez déjà un compte ?`)
};

export const dashboard_email = /** @type {(inputs: Dashboard_EmailInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`E-mail : `)
};

export const dashboard_logged_in = /** @type {(inputs: Dashboard_Logged_InInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous êtes connecté(e).`)
};

export const dashboard_member_since = /** @type {(inputs: Dashboard_Member_SinceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Membre depuis : `)
};

export const dashboard_title = /** @type {(inputs: Dashboard_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tableau de bord`)
};

export const error_too_many_requests = /** @type {(inputs: Error_Too_Many_RequestsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Trop de requêtes. Veuillez réessayer plus tard.`)
};

export const field_email = /** @type {(inputs: Field_EmailInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`E-mail`)
};

export const field_password = /** @type {(inputs: Field_PasswordInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mot de passe`)
};

export const field_password_confirmation = /** @type {(inputs: Field_Password_ConfirmationInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirmer le mot de passe`)
};

export const field_password_hint = /** @type {(inputs: Field_Password_HintInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Entre 12 et 32 caractères.`)
};

export const forgot_password_back_to_login = /** @type {(inputs: Forgot_Password_Back_To_LoginInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour à la page de connexion`)
};

export const forgot_password_submit = /** @type {(inputs: Forgot_Password_SubmitInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer le lien`)
};

export const forgot_password_submit_pending = /** @type {(inputs: Forgot_Password_Submit_PendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoi en cours…`)
};

export const forgot_password_subtitle = /** @type {(inputs: Forgot_Password_SubtitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Saisissez votre e-mail pour recevoir un lien de réinitialisation.`)
};

export const forgot_password_success = /** @type {(inputs: Forgot_Password_SuccessInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Si un compte existe pour cet e-mail, un lien de réinitialisation a été envoyé.`)
};

export const forgot_password_title = /** @type {(inputs: Forgot_Password_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mot de passe oublié`)
};

export const login_submit = /** @type {(inputs: Login_SubmitInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se connecter`)
};

export const login_submit_pending = /** @type {(inputs: Login_Submit_PendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connexion en cours…`)
};

export const login_subtitle = /** @type {(inputs: Login_SubtitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Saisissez vos identifiants ci-dessous pour vous connecter.`)
};

export const login_title = /** @type {(inputs: Login_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se connecter à votre compte`)
};

export const logout_submit = /** @type {(inputs: Logout_SubmitInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se déconnecter`)
};

export const logout_submit_pending = /** @type {(inputs: Logout_Submit_PendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Déconnexion en cours…`)
};

export const reset_password_back_to_login = /** @type {(inputs: Reset_Password_Back_To_LoginInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se connecter`)
};

export const reset_password_invalid_token = /** @type {(inputs: Reset_Password_Invalid_TokenInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le lien de réinitialisation est invalide ou incomplet.`)
};

export const reset_password_submit = /** @type {(inputs: Reset_Password_SubmitInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réinitialiser le mot de passe`)
};

export const reset_password_submit_pending = /** @type {(inputs: Reset_Password_Submit_PendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réinitialisation en cours…`)
};

export const reset_password_subtitle = /** @type {(inputs: Reset_Password_SubtitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisissez un nouveau mot de passe pour votre compte.`)
};

export const reset_password_success = /** @type {(inputs: Reset_Password_SuccessInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter.`)
};

export const reset_password_title = /** @type {(inputs: Reset_Password_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réinitialiser votre mot de passe`)
};