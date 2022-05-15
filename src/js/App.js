import moment from 'moment-timezone';

export default class App {
  constructor() {
    this.username = null;
  }

  init() {
    this.initListeners();
  }

  initListeners() {
    this.continueBtnOnclick();
  }

  continueBtnOnclick() {
    const continueBtn = document.getElementById('continue-btn');
    const input = document.getElementById('main-form-input');
    const mainContainer = document.querySelector('.main_container');
    continueBtn.addEventListener('click', async () => {
      this.username = input.value;
      if (await this.checkUsernameValidity()) {
        mainContainer.classList.remove('hidden');
        input.closest('.main_form').classList.add('hidden');
        this.connectWS();
        this.startRenderInterval();
      } else {
        App.showLoginError();
      }
    });
  }

  connectWS() {
    const ws = new WebSocket('wss://corpchat-be.herokuapp.com/chat', this.username);
    const chat = document.querySelector('.chat');
    this.onMessageType(ws);
    ws.addEventListener('message', (evt) => {
      this.renderMessage(evt.data);
      chat.scrollBy(0, 999);
    });
  }

  renderUserList(users) {
    const list = document.querySelector('.user_list');
    list.innerHTML = '';
    users.forEach((e) => {
      if (e.username === this.username) {
        list.innerHTML += `
        <div class="user_self">
          <div class="avatar"></div>
          <span class="user_name">You</span>
        </div>
      `;
      } else {
        list.innerHTML += `
        <div class="user">
          <div class="avatar"></div>
          <span class="user_name">${e.username}</span>
        </div>
      `;
      }
    });
  }

  renderMessage(data) {
    const parsed = JSON.parse(data);
    const chat = document.querySelector('.chat');
    if (this.username === parsed.username) {
      chat.innerHTML += `
      <div class="message_self">
        <span class="name_and_date">You, ${parsed.date}</span>
        <span class="message_text">${parsed.message}</span>
      </div>
      `;
    } else {
      chat.innerHTML += `
      <div class="message">
        <span class="name_and_date">${parsed.username}, ${parsed.date}</span>
        <span class="message_text">${parsed.message}</span>
      </div>
      `;
    }
  }

  startRenderInterval() {
    setTimeout(async () => {
      const rawResponse = await fetch('https://corpchat-be.herokuapp.com/connections');
      const response = await rawResponse.json();
      this.renderUserList(response);
    }, 500);
    this.interval = setInterval(async () => {
      const rawResponse = await fetch('https://corpchat-be.herokuapp.com/connections');
      const response = await rawResponse.json();
      this.renderUserList(response);
    }, 2000);
  }

  async checkUsernameValidity() {
    const rawResponse = await fetch('https://corpchat-be.herokuapp.com/connections');
    this.clients = await rawResponse.json();
    if (this.clients.find((x) => x.username === this.username)) {
      return false;
    }
    return true;
  }

  onMessageType(ws) {
    const input = document.getElementById('send-message');
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const date = moment.tz('Europe/Moscow').format('kk:mm DD.MM.YYYY');
        const obj = { username: this.username, message: input.value, date };
        ws.send(JSON.stringify(obj));
        input.value = '';
      }
    });
  }

  static showLoginError() {
    const errorMsg = document.querySelector('.error_message');
    if (errorMsg.classList.contains('shake')) {
      errorMsg.classList.remove('fade');
      errorMsg.style.animation = 'none';
      setTimeout(() => {
        errorMsg.style.animation = '';
      }, 10);
      this.errorTimeout = setTimeout(() => {
        errorMsg.classList.add('fade');
      }, 2000);
    } else {
      errorMsg.classList.remove('invisible');
      errorMsg.classList.add('shake');
      this.errorTimeout = setTimeout(() => {
        errorMsg.classList.add('fade');
      }, 2000);
    }
  }
}
