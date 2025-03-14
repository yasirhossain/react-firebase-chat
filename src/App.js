import React, { useRef, useState } from 'react';
import './App.css';
import './Chat.scss';
import { firebaseConfig } from './config';

import firebase from 'firebase/compat/app';
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/analytics";

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

import moment from 'moment';

const firebaseApp = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(firebaseApp);
const db = firebase.firestore(firebaseApp);
const analytics = firebase.analytics(firebaseApp);

function App() {

  const [user] = useAuthState(auth);

  return (
    <div className="App">
      <header>
        <h1>Sandbox Env</h1>
        <SignOut />
      </header>
      <section className="body">
        <section className="main">
          <p>Main Body</p>
        </section>
        <section className="rail">
          {user ? <ChatRoom /> : <SignIn />}
        </section>
      </section>

    </div>
  );
}

function SignIn() {
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  }

  return (
    <>
      <button className="sign-in" onClick={signInWithGoogle}>Sign in with Google</button>
      <p>Do not violate the community guidelines or you will be banned for life!</p>
    </>
  )

}

function SignOut() {
  return auth.currentUser && (
    <button className="sign-out" onClick={() => auth.signOut()}>Sign Out</button>
  )
}


function ChatRoom() {
  const dummy = useRef();

  const messagesRef = db.collection('messages');
  const query = messagesRef.orderBy('createdAt').limit(50);
  const [messages] = useCollectionData(query, { idField: 'id' });
  const [formValue, setFormValue] = useState('');

  const sendMessage = async (e) => {
    e.preventDefault();

    const { uid, photoURL, displayName } = auth.currentUser;

    await messagesRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      displayName,
      photoURL    
    })

    setFormValue('');
    dummy.current.scrollIntoView({ behavior: 'smooth' });
  }

  return (<>
    <main className="chat">
      {messages && messages.map(msg => <ChatMessage key={msg.createdAt} message={msg} />)}
    </main>

    <form onSubmit={sendMessage} className="chatInput">
      <div className="inputContainer">
        <input 
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)} 
          placeholder="Say something..." />
        <button type="submit" disabled={!formValue}>Go</button>
      </div>
    </form>
  </>)
}

function ChatMessage(props) {
  const { text, uid, photoURL, displayName, createdAt } = props.message;

  // console.log(props.message);
  // console.log(createdAt.seconds);

  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';
  const userName = displayName ? displayName : 'User';

  return (<>
    <div className={`message ${messageClass}`}>
      <img alt="avatar" className="avatar" src={photoURL || 'https://api.adorable.io/avatars/23/abott@adorable.png'} />
      <div className="messageContainer">
        <p className="username">{ userName }</p>
        <p className="message">{text}</p>
        <p className="date">{moment(createdAt.seconds).add(3, 'days').calendar()}</p>
      </div>
    </div>
  </>)
}


export default App;
