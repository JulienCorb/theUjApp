/* eslint-disable */
/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */
/** @typedef {{}} Auth_Login_LinkInputs */
/** @typedef {{}} Auth_Login_PromptInputs */
/** @typedef {{}} Auth_Signup_LinkInputs */
/** @typedef {{}} Auth_Signup_PromptInputs */
/** @typedef {{}} Dashboard_EmailInputs */
/** @typedef {{}} Dashboard_Logged_InInputs */
/** @typedef {{}} Dashboard_Member_SinceInputs */
/** @typedef {{}} Dashboard_TitleInputs */
/** @typedef {{}} Error_Too_Many_RequestsInputs */
/** @typedef {{}} Field_EmailInputs */
/** @typedef {{}} Field_PasswordInputs */
/** @typedef {{}} Field_Password_ConfirmationInputs */
/** @typedef {{}} Field_Password_HintInputs */
/** @typedef {{}} Login_SubmitInputs */
/** @typedef {{}} Login_Submit_PendingInputs */
/** @typedef {{}} Login_SubtitleInputs */
/** @typedef {{}} Login_TitleInputs */
/** @typedef {{}} Logout_SubmitInputs */
/** @typedef {{}} Logout_Submit_PendingInputs */
/** @typedef {{}} Signup_SubmitInputs */
/** @typedef {{}} Signup_Submit_PendingInputs */
/** @typedef {{}} Signup_SubtitleInputs */
/** @typedef {{}} Signup_TitleInputs */


export const auth_login_link = /** @type {(inputs: Auth_Login_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se connecter`)
};

export const auth_login_prompt = /** @type {(inputs: Auth_Login_PromptInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous avez déjà un compte ?`)
};

export const auth_signup_link = /** @type {(inputs: Auth_Signup_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`S'inscrire`)
};

export const auth_signup_prompt = /** @type {(inputs: Auth_Signup_PromptInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous n'avez pas de compte ?`)
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

export const signup_submit = /** @type {(inputs: Signup_SubmitInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`S'inscrire`)
};

export const signup_submit_pending = /** @type {(inputs: Signup_Submit_PendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Création du compte…`)
};

export const signup_subtitle = /** @type {(inputs: Signup_SubtitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Saisissez vos informations ci-dessous pour vous inscrire.`)
};

export const signup_title = /** @type {(inputs: Signup_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer votre compte`)
};