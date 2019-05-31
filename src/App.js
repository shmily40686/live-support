import React from 'react';
const questions = [
  {
    "id": -1,
    "question": "Sorry, we can't help you at this time. Have a nice day!",
    "validation": false
  },
  {
    "id": 0,
    "question": "Do you live in California?",
    "validation": ["yes", "no"],
    "paths": {"yes": 1, "no": -1},
  },
  {
    "id": 1,
    "question": "Are you suffering from insomnia?",
    "validation": ["yes", "no"],
    "paths": {"yes": 2, "no": -1}
  },
  {
    "id": 2,
    "question": "What's your email?",
    "validation": /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/,
    "paths": 3,
    "//comment": "regex from https://emailregex.com"
  },
  {
    "id": 3,
    "question": "What's your full name? (This information must match your photo ID.)",
    "validation": true,
    "paths": 4
  },
  {
    "id": 4,
    "question": "Please input a password.",
    "style": "password",
    "validation": /.{6,}/, // at least 6 length
    "paths": 5
  },
  {
    "id": 5,
    "question": "When were you born? (mm/dd/yyyy)",
    // "validation": /^\\d{1,2}\/\\d{1,2}\/\\d{4}$/, // this doesn't validate correctly
    "validation": /^\d{1,2}\/\d{1,2}\/\d{4}$/,
    "paths": 6
  },
  {
    "id": 6,
    "question": "How long have you had trouble sleeping? Past week, past month, or longer?",
    "validation": ["past week", "past month", "longer"],
    "paths": 7
  },
  {
    "id": 7,
    "question": "Is there anything else we should know?",
    "validation": true,
    "paths": 8
  },
  {
    "id": 8,
    "question": "Thank you so much! You will be connected to a physician shortly",
    "validation": false
  }
];

class App extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      open: false,
      supporter: "Kyle Robertson",
      user:{
        firstName:"Xiaowen"
      },
      chat:[],
      lastQuestionAsked: null,
      isStillSupporting: true
    }
    this.openOrCloseChat = this.openOrCloseChat.bind(this);
    this.sendText = this.sendText.bind(this);
    this.createSupportResponse = this.createSupportResponse.bind(this);
    this.supportInitialResponses = this.supportInitialResponses.bind(this);
    this.delaySupportResponse = this.delaySupportResponse.bind(this);
    this.wasValidAnswer = this.wasValidAnswer.bind(this);
    this.determineNextQuestion = this.determineNextQuestion.bind(this);
    this.scrollToBottom = this.scrollToBottom.bind(this);
    this.createPutRequest = this.createPutRequest.bind(this);
  }

  sendText() {
    if (this.text.value.trim() !== '') {
      this.setState({
        chat: this.state.chat.concat({
          name: 'You',
          text:this.text.value
        })
      }, () => {
        this.text.value = '';
        this.scrollToBottom();
        this.createSupportResponse();
      });
    } else {
      this.text.value = '';
    }
  }

  openOrCloseChat() {
    this.setState({
      open: !this.state.open,
      lastQuestionAsked: this.state.lastQuestionAsked !== null ? this.state.lastQuestionAsked : 1
    }, () => {
      if (this.state.isStillSupporting && (this.state.chat.length === 0 || this.state.chat[this.state.chat.length - 1].name === 'You')) this.createSupportResponse();
    });
  }

  createSupportResponse() {
    if (this.state.isStillSupporting) {
      if (this.state.chat.length === 0) {
        this.supportInitialResponses();
      } else {
        const lastUserMessage = this.state.chat[this.state.chat.length - 1].text;
        if (this.wasValidAnswer(lastUserMessage)) {
          this.createPutRequest(lastUserMessage);
          let nextQuestion = questions[this.determineNextQuestion(lastUserMessage)];
          this.setState({
            lastQuestionAsked: nextQuestion.id + 1,
            isStillSupporting: nextQuestion.validation !== false
          }, () => this.delaySupportResponse({
              name: this.state.supporter,
              text: nextQuestion.question
            }, 1750));
        } else {
          const defaultMessage = {
            name: this.state.supporter,
            text: `I'm sorry I don't understand. ${questions[this.state.lastQuestionAsked].question}`
          };
          this.delaySupportResponse(defaultMessage, 2500);
        }
      }
    }
  }

  createPutRequest(answer) {
    fetch(`https://jsonplaceholder.typicode.com/posts/${this.state.lastQuestionAsked - 1}`, {
        method: 'PUT',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(answer),
    });
  }

  supportInitialResponses() {
    this.delaySupportResponse({
        name: this.state.supporter,
        text: `Hello, ${this.state.user.firstName}!`
      }, 1000);
    this.delaySupportResponse({
        name: this.state.supporter,
        text: questions[1].question
      }, 1500);
  }

  delaySupportResponse(chat, delay) {
    setTimeout(() => {
      this.setState({
        chat: this.state.chat.concat(chat)
      }, this.scrollToBottom);
    }, delay);
  }

  wasValidAnswer(answer) {
    const validation = questions[this.state.lastQuestionAsked].validation;
    if (Array.isArray(validation)) {
      return validation.includes(answer.toLowerCase());
    } else if (typeof validation === 'boolean') {
      return true;
    } else {
      return validation.test(answer);
    }
  }

  determineNextQuestion(answer) {
    const lastQuestion = questions[this.state.lastQuestionAsked];
    const validation = lastQuestion.validation;
    if (Array.isArray(validation)) {
      return (typeof lastQuestion.paths === 'object' ? lastQuestion.paths[answer.toLowerCase()] : lastQuestion.paths) + 1;
    } else if (typeof validation === 'boolean') {
      if (validation) {
        return lastQuestion.paths + 1;
      } else {
        return lastQuestion.id + 1;
      }
    } else {
      return lastQuestion.paths + 1;
    }
  }

  scrollToBottom() {
    this.chatArea.scrollTop = this.chatArea.scrollHeight;
  }

  render () {
    return (
      <div className="mainContainer">
        <div className="mainTabBlock">
          <div className="mainTab" onClick={this.openOrCloseChat}>Live Support</div>
        </div>
        {this.state.open
          ? <div>
              <div className="supporter">
                <img className="supportImg" src="https://d25hn4jiqx5f7l.cloudfront.net/companies/logos/thumb/cerebral_1551986175.jpg?1551986175"/>
                <span className="supportName">{this.state.supporter}</span>
              </div>
              <div className="chatArea" ref={el => this.chatArea = el}>
                {
                  this.state.chat.map(eachChat => {
                    return(
                        <div className="eachChat">
                          <div className={`msgAuthor ${eachChat.name === 'You' ? 'youMsg' : 'supMsg'}`}>{eachChat.name}:</div>
                          <div className="msgText">{eachChat.text}</div>
                        </div>
                      )
                  })
                }
              </div>
              <div className="userInput">
                <input className="textInput" type="text" ref={el => this.text = el} />
                <button className="btnInput" onClick={this.sendText}>Send</button>
              </div>
            </div>
          : null
        }
      </div>
    );
  }
}

export default App;
