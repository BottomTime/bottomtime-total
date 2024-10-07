function copyJwt() {
  const jwt = document.getElementById('jwt');
  const copiedMessage = document.getElementById('msgCopied');

  navigator.clipboard.writeText(jwt.innerText).then(() => {
    copiedMessage.classList.remove('invisible');

    setTimeout(() => {
      copiedMessage.classList.add('invisible');
    }, 3000);
  });
}

document.getElementById('btnCopy').addEventListener('click', copyJwt);
