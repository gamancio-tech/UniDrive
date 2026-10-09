import nodemailer from "nodemailer";

export const emailService = {
  async sendMagicLink(email: string, token: string) {
    // Para ambiente de desenvolvimento (didático), usamos o Ethereal
    // que cria contas de teste automaticamente e intercepta os emails
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const resetLink = `http://localhost:5173/redefinir-senha?token=${token}`;

    const info = await transporter.sendMail({
      from: '"UniDrive App" <noreply@unidrive.com>',
      to: email,
      subject: "Redefinição de Senha - UniDrive",
      html: `
        <h2>Recuperação de Senha</h2>
        <p>Você solicitou a redefinição da sua senha no UniDrive.</p>
        <p>Clique no link abaixo para criar uma nova senha:</p>
        <p><a href="${resetLink}" target="_blank">Redefinir minha senha</a></p>
        <p><i>Este link expira em 15 minutos.</i></p>
        <br/>
        <p>Se você não solicitou, apenas ignore este e-mail.</p>
      `,
    });

    // Como estamos usando Ethereal, mostramos a URL no console para você conseguir abrir
    console.log("=========================================");
    console.log("✉️ E-MAIL ENVIADO COM SUCESSO!");
    console.log("🔗 CLIQUE AQUI PARA VER O E-MAIL (Ethereal):");
    console.log(nodemailer.getTestMessageUrl(info));
    console.log("=========================================");
  },
};
