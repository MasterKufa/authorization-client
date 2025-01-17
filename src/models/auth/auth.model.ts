import { combine, createEffect, createEvent, restore, sample } from "effector";
import { authApi } from "../../api";
import { createGate } from "effector-react";
import { Notification, authTools } from "@master_kufa/client-tools";
import { applicationsModel } from "models/applications";

export const loginTextChanged = createEvent<string>();
export const passwordTextChanged = createEvent<string>();
export const authClicked = createEvent();

export const $loginText = restore(loginTextChanged, "");
export const $passwordText = restore(passwordTextChanged, "");

export const $isEmptyFields = combine(
  $loginText,
  $passwordText,
  (loginText, passwordText) => !(loginText && passwordText)
);

export const $authPending = authApi.authFx.pending;

export const PageGate = createGate();

export const saveTokenFx = createEffect<string, void>(
  authTools.handleAuthorized
);

sample({
  clock: authClicked,
  source: [$loginText, $passwordText, applicationsModel.$application] as const,
  fn: ([login, password, application]) => ({
    password,
    login,
    application: application!,
  }),
  target: authApi.authFx,
});

sample({
  clock: authApi.authFx.doneData,
  target: saveTokenFx,
});

sample({
  clock: authApi.authFx.failData,
  fn: (message: string): Notification.PayloadType => ({
    type: "error",
    message,
  }),
  target: Notification.add,
});

$loginText.reset([PageGate.close, authApi.authFx.done]);
$passwordText.reset([PageGate.close, authApi.authFx.done]);
