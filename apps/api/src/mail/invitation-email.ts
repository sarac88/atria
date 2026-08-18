const NAVY = "#16244A";
const ACCENT = "#F4B223";
const PAGE = "#FBF7EF";

const dateFormat = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
  timeZone: "Europe/Madrid",
});

/** Los nombres de clase y docente son datos introducidos por el usuario. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface InvitationEmailParams {
  className: string;
  classSubject: string;
  teacherName: string;
  url: string;
  expiresAt: Date;
  /** El invitado ya tiene cuenta: sólo tiene que iniciar sesión para unirse. */
  hasAccount: boolean;
}

export function invitationEmail(params: InvitationEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const { className, classSubject, teacherName, url, expiresAt, hasAccount } = params;
  const expiry = dateFormat.format(expiresAt);
  const action = hasAccount
    ? "Entra con tu cuenta de Atria para unirte a la clase."
    : "Desde el enlace podrás crear tu cuenta y entrar directamente en la clase.";

  const subject = `${teacherName} te invita a ${className} en Atria`;

  const text = [
    `${teacherName} te ha invitado a su clase "${className}" en Atria.`,
    "",
    action,
    "",
    `Acepta la invitación aquí: ${url}`,
    "",
    `El enlace caduca el ${expiry}. Si no lo esperabas, puedes ignorar este correo.`,
  ].join("\n");

  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:${PAGE};font-family:Helvetica,Arial,sans-serif;color:${NAVY};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;padding:36px;">
            <tr>
              <td style="font-size:22px;font-weight:bold;letter-spacing:.02em;padding-bottom:28px;">Atria</td>
            </tr>
            <tr>
              <td style="font-size:15px;line-height:1.5;color:#5A6478;padding-bottom:4px;">
                ${escapeHtml(teacherName)} te invita a su clase
              </td>
            </tr>
            <tr>
              <td style="font-size:24px;font-weight:bold;line-height:1.3;padding-bottom:${classSubject ? "4px" : "20px"};">
                ${escapeHtml(className)}
              </td>
            </tr>
            ${classSubject ? `<tr><td style="font-size:14px;color:#5A6478;padding-bottom:20px;">${escapeHtml(classSubject)}</td></tr>` : ""}
            <tr>
              <td style="font-size:15px;line-height:1.6;padding-bottom:28px;">${action}</td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:28px;">
                <a href="${url}" style="display:inline-block;background:${ACCENT};color:${NAVY};font-weight:bold;font-size:15px;text-decoration:none;padding:14px 28px;border-radius:10px;">
                  Aceptar la invitación
                </a>
              </td>
            </tr>
            <tr>
              <td style="font-size:13px;line-height:1.6;color:#5A6478;">
                El enlace caduca el ${expiry}. Si el botón no funciona, copia esta dirección en tu navegador:<br />
                <a href="${url}" style="color:#2E5AAC;word-break:break-all;">${url}</a>
              </td>
            </tr>
          </table>
          <div style="max-width:520px;font-size:12px;color:#8A93A6;padding:18px 8px 0;text-align:center;">
            Si no esperabas esta invitación, puedes ignorar este correo.
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
