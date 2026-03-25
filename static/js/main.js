// static/js/main.js
document.querySelector('form').addEventListener('submit', function(e) {
    const percepcao = document.querySelector('textarea[name="percepcao"]').value;
    
    if (percepcao.length < 20) {
        e.preventDefault(); // Impede o envio do formulário
        alert('Para o nosso levantamento, por favor, escreva um pouco mais sobre sua percepção (mínimo 20 caracteres).');
    }
});