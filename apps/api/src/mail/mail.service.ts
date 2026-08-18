import { Injectable, Logger } from "@nestjs/common";
import { createTransport, type Transporter } from "nodemailer";

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Envío de correo por SMTP (en desarrollo, la bandeja de Mailtrap). El SMTP es
 * opcional: si no está configurado no se envía nada y la operación que lo
 * dispara sigue adelante, porque los enlaces también se comparten a mano.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private warned = false;

  private resolveTransport(): Transporter | null {
    if (this.transporter) return this.transporter;
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) {
      if (!this.warned) {
        this.logger.warn(
          "SMTP sin configurar (SMTP_HOST/SMTP_USER/SMTP_PASS): no se enviarán correos.",
        );
        this.warned = true;
      }
      return null;
    }
    const port = Number(process.env.SMTP_PORT ?? 2525);
    this.transporter = createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    return this.transporter;
  }

  /** true si el correo ha salido. No lanza: un fallo de SMTP no debe romper la petición. */
  async send(input: SendMailInput): Promise<boolean> {
    const transport = this.resolveTransport();
    if (!transport) return false;
    try {
      await transport.sendMail({
        from: process.env.MAIL_FROM ?? "Atria <no-reply@atria.edu>",
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });
      this.logger.log(`Correo enviado a ${input.to}: ${input.subject}`);
      return true;
    } catch (error) {
      this.logger.error(`No se pudo enviar el correo a ${input.to}`, error as Error);
      return false;
    }
  }
}
