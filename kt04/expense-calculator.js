class ExpenseCalculator extends HTMLElement {
    constructor() {
        super();
        
        // Реактивное состояние компонента
        this.state = this.createReactiveState({
            expenses: [],
            total: 0
        });
        
        // Привязываем контекст для методов
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
    }
    
    // Создаем реактивное состояние с Proxy
    createReactiveState(initialState) {
        const self = this;
        
        return new Proxy(initialState, {
            set(target, property, value) {
                target[property] = value;
                
                // Пересчитываем общую сумму при изменении расходов
                if (property === 'expenses') {
                    target.total = value.reduce((sum, expense) => sum + expense.amount, 0);
                }
                
                // Обновляем UI при любом изменении состояния
                self.updateUI();
                return true;
            }
        });
    }
    
    // Подключение компонента к DOM
    connectedCallback() {
        this.render();
        this.attachEventListeners();
    }
    
    // Рендеринг компонента
    render() {
        this.innerHTML = `
            <div class="expense-calculator">
                <div class="calculator-header">
                    <h2>Учет расходов</h2>
                    <p class="subtitle">Добавляйте и отслеживайте свои траты</p>
                </div>
                
                <form class="expense-form" id="expenseForm">
                    <div class="form-group">
                        <input 
                            type="text" 
                            id="expenseName" 
                            placeholder="Название расхода (например: Продукты, Транспорт)"
                            required
                            class="form-input"
                        >
                    </div>
                    
                    <div class="form-group">
                        <div class="amount-input-wrapper">
                            <input 
                                type="number" 
                                id="expenseAmount" 
                                placeholder="Сумма"
                                min="0"
                                step="0.01"
                                required
                                class="form-input"
                            >
                            <span class="currency">₽</span>
                        </div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">
                        <span class="btn-icon">+</span>
                        Добавить расход
                    </button>
                </form>
                
                <div class="summary-card">
                    <div class="total-expenses">
                        <span class="total-label">Общая сумма:</span>
                        <span class="total-amount" id="totalAmount">0 ₽</span>
                    </div>
                    <div class="expense-count">
                        <span class="count-label">Количество расходов:</span>
                        <span class="count-number" id="expenseCount">0</span>
                    </div>
                </div>
                
                <div class="expenses-section">
                    <h3 class="section-title">Список расходов</h3>
                    <div class="expenses-list" id="expensesList">
                        <div class="empty-state" id="emptyState">
                            <div class="empty-icon">📋</div>
                            <p>Расходы еще не добавлены</p>
                            <p class="empty-hint">Добавьте ваш первый расход выше</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Обновление UI на основе текущего состояния
    updateUI() {
        const totalAmountElement = this.querySelector('#totalAmount');
        const expenseCountElement = this.querySelector('#expenseCount');
        const expensesListElement = this.querySelector('#expensesList');
        const emptyStateElement = this.querySelector('#emptyState');
        
        if (totalAmountElement) {
            totalAmountElement.textContent = `${this.state.total.toFixed(2)} ₽`;
        }
        
        if (expenseCountElement) {
            expenseCountElement.textContent = this.state.expenses.length;
        }
        
        if (expensesListElement) {
            // Удаляем текущий список
            expensesListElement.innerHTML = '';
            
            if (this.state.expenses.length === 0) {
                // Показываем сообщение, если нет расходов
                expensesListElement.appendChild(emptyStateElement);
            } else {
                // Создаем элементы для каждого расхода
                this.state.expenses.forEach((expense, index) => {
                    const expenseElement = this.createExpenseElement(expense, index);
                    expensesListElement.appendChild(expenseElement);
                });
            }
        }
    }
    
    // Создание элемента расхода
    createExpenseElement(expense, index) {
        const div = document.createElement('div');
        div.className = 'expense-item';
        div.dataset.index = index;
        
        div.innerHTML = `
            <div class="expense-info">
                <div class="expense-name">${expense.name}</div>
                <div class="expense-date">${expense.date}</div>
            </div>
            <div class="expense-actions">
                <div class="expense-amount">${expense.amount.toFixed(2)} ₽</div>
                <button class="btn-delete" data-index="${index}" aria-label="Удалить расход">
                    <svg class="delete-icon" viewBox="0 0 24 24" width="16" height="16">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
            </div>
        `;
        
        return div;
    }
    
    // Добавление обработчиков событий
    attachEventListeners() {
        const form = this.querySelector('#expenseForm');
        if (form) {
            form.addEventListener('submit', this.handleSubmit);
        }
        
        // Обработчик для удаления расходов (делегирование событий)
        this.addEventListener('click', (e) => {
            if (e.target.closest('.btn-delete')) {
                const button = e.target.closest('.btn-delete');
                const index = parseInt(button.dataset.index);
                this.handleDelete(index);
            }
        });
        
        // Очистка формы при фокусе
        const inputs = this.querySelectorAll('.form-input');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.classList.add('focused');
            });
            
            input.addEventListener('blur', () => {
                input.classList.remove('focused');
            });
        });
    }
    
    // Обработка добавления нового расхода
    handleSubmit(event) {
        event.preventDefault();
        
        const nameInput = this.querySelector('#expenseName');
        const amountInput = this.querySelector('#expenseAmount');
        
        const name = nameInput.value.trim();
        const amount = parseFloat(amountInput.value);
        
        if (!name || isNaN(amount) || amount <= 0) {
            this.showError('Пожалуйста, введите корректные данные');
            return;
        }
        
        // Создаем новый расход
        const newExpense = {
            id: Date.now(),
            name: name,
            amount: amount,
            date: new Date().toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        };
        
        // Добавляем в реактивное состояние
        this.state.expenses = [...this.state.expenses, newExpense];
        
        // Очищаем форму
        nameInput.value = '';
        amountInput.value = '';
        nameInput.focus();
        
        // Показываем подтверждение
        this.showSuccess('Расход успешно добавлен!');
    }
    
    // Обработка удаления расхода
    handleDelete(index) {
        if (confirm('Вы уверены, что хотите удалить этот расход?')) {
            const newExpenses = this.state.expenses.filter((_, i) => i !== index);
            this.state.expenses = newExpenses;
            
            this.showInfo('Расход удален');
        }
    }
    
    // Вспомогательные методы для уведомлений
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showInfo(message) {
        this.showNotification(message, 'info');
    }
    
    showNotification(message, type) {
        // Удаляем предыдущие уведомления
        const oldNotification = this.querySelector('.notification');
        if (oldNotification) {
            oldNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        this.querySelector('.expense-calculator').appendChild(notification);
        
        // Автоматическое скрытие через 3 секунды
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 3000);
    }
}

// Регистрируем веб-компонент
customElements.define('expense-calculator', ExpenseCalculator);