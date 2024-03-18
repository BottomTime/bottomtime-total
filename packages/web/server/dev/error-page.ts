export const ErrorPageHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Exo+2&family=Lobster&display=swap"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Alegreya+Sans&display=swap"
      rel="stylesheet"
    />
    <link rel="icon" type="image/png" href="/favicon.ico" />
    <title>Bottom Time | Server Error</title>
  </head>
  <body>
    <h1>Server Error</h1>
    <h2>HTTP 500</h2>

    <p>
      <span>
        <strong>Name: </strong>
      </span>
      <span>{{ name }}</span>
    </p>
    <p>
      <span>
        <strong>Message: </strong>
      </span>
      <span>{{ message }}</span>
    </p>
    <p>
      <span>
        <strong>Stack: </strong>
      </span>
      <pre>{{ stack }}</pre>
    </p>
  </body>
</html>
`;
