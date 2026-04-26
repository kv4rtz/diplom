export const getResetPasswordHtml = (link: string) => {
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Сброс пароля</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f4f7;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .email-wrapper {
      width: 100%;
      background-color: #f4f4f7;
      padding: 40px 0;
    }
    .email-content {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
    }
    .email-header {
      background-color: #4f46e5;
      color: #ffffff;
      padding: 20px;
      text-align: center;
      font-size: 24px;
      font-weight: bold;
    }
    .email-body {
      padding: 30px;
      font-size: 16px;
      line-height: 1.5;
    }
    .code-box {
      display: inline-block;
      background-color: #f0f0ff;
      border: 1px dashed #4f46e5;
      border-radius: 6px;
      padding: 12px 24px;
      font-size: 24px;
      font-weight: bold;
      letter-spacing: 4px;
      color: #111827;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #888;
      padding: 20px;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-content">
      <div class="email-header">Сброс пароля</div>
      <div class="email-body">
        <p>Здравствуйте!</p>
        <p>Вы запрашивали сброс пароля. Перейдите по ссылке для сброса пароля: <a href=${link}>кликабельно</a></p>

        <p>Если вы не запрашивали этот код, просто проигнорируйте это письмо.</p>
      </div>
    </div>
    <div class="footer">
      © 2025 Betagames. Все права защищены.
    </div>
  </div>
</body>
`;
};
