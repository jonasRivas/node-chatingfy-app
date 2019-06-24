const socket = io();

//Elements

const $msgForm = document.querySelector('#msgForm');
const $msgFormInput = $msgForm.querySelector('input');
const $msgFormBtn = $msgForm.querySelector('button');
const $locationBtn = document.querySelector('#sendLocation');
const $messages = document.querySelector('#messages');


//Template
const messageTemplate = document.querySelector('#message-template').innerHTML;
const linkTemplate = document.querySelector('#link-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const {
    username,
    room
} = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

const autoscroll = () => {
    //New messageElement
    const $newMessage = $messages.lastElementChild;
    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
    //Visible height;
    const visibleHeight = $messages.offsetHeight;
    //Height of messages container
    const containerHeight = $messages.scrollHeight;
    //How far have i scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight;
    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }

};

socket.on('message', (data) => {
    const html = Mustache.render(messageTemplate, {
        username: data.username,
        message: data.text,
        createdAt: moment(data.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('locationMessage', (data) => {
    const html = Mustache.render(linkTemplate, {
        username: data.username,
        url: data.text,
        createdAt: moment(data.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('roomData', ({
    room,
    users
}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML = html;
});


document.querySelector('#msgForm').addEventListener('submit', (e) => {
    e.preventDefault();
    $msgFormBtn.setAttribute('disabled', 'disabled');

    const msg = e.target.elements.message.value;
    socket.emit('sendMsg', msg, (error) => {
        $msgFormBtn.removeAttribute('disabled');
        $msgFormInput.value = '';
        $msgFormInput.focus();

        if (error) {
            return console.log(error);
        }
        console.log('the message was delivered!');
    });
});

$locationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation not supported by your browser');
    }
    $locationBtn.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {

        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $locationBtn.removeAttribute('disabled');
        });
    });
});

socket.emit('join', {
    username,
    room
}, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});