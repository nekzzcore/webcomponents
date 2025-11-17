class CardComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
            <style>
                .card {
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    max-width: 300px;
                    background: white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    margin: 10px;
                    position: relative;
                }
                .card-header {
                    background: #667eea;
                    color: white;
                    padding: 15px;
                    margin: 0;
                }
                .card-content {
                    padding: 15px;
                }
                .delete-btn {
                    position: absolute;
                    top: 5px;
                    right: 10px;
                    background: #ff4757;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 25px;
                    height: 25px;
                    cursor: pointer;
                    font-size: 14px;
                }
            </style>
            <div class="card">
                <button class="delete-btn" onclick="this.closest('card-component').remove()">×</button>
                <div class="card-header">
                    <slot name="header">Заголовок</slot>
                </div>
                <div class="card-content">
                    <slot name="content">Контент</slot>
                </div>
            </div>
        `;
    }
}

customElements.define('card-component', CardComponent);

// Функции для управления карточками
window.cardManager = {
    addCard(header = 'Новая карточка', content = 'Содержимое карточки') {
        const card = document.createElement('card-component');
        card.innerHTML = `
            <span slot="header">${header}</span>
            <span slot="content">${content}</span>
        `;
        document.body.appendChild(card);
    },

    addCustomCard() {
        const header = prompt('Введите заголовок:', 'Моя карточка');
        const content = prompt('Введите содержимое:', 'Текст карточки');
        if (header && content) {
            this.addCard(header, content);
        }
    },

    clearAllCards() {
        document.querySelectorAll('card-component').forEach(card => card.remove());
    }
};