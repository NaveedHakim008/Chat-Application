const messageForm=document.getElementById('message-form')
const sendButton=messageForm.elements[1]
const message =messageForm.elements[0]
const newMessage=document.getElementById('messages')
//templates
const messageTemplate=document.getElementById('message-template').innerHTML
const locationTemplate=document.getElementById('location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const {username,room}=Qs.parse(location.search,{ignoreQueryPrefix:true})
console.log(username,room)


const socket=io()
 socket.on('receiveMessage',(message)=>{

     const html=Mustache.render(messageTemplate,{
         username:message.username,
          message:message.text,
             createdAt:moment(message.createdAt).format('h:mm a')
     }
     )
     newMessage.insertAdjacentHTML('beforeend',html)
 })


socket.on('message',(message)=>{
console.log(message)
    const html=Mustache.render(messageTemplate,{
        username:message.username,
        message:message.text,
        createdAt:moment(message.createdAt).format('h:mm a')
        }
    )
    newMessage.insertAdjacentHTML('beforeend',html)
})
socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()

    sendButton.setAttribute('disabled','disabled')
    socket.emit('sendMessage',message.value,(error)=>{

        sendButton.removeAttribute('disabled')
        message.value=''
        message.focus()
        if(error)
            console.log(error)
        else

        console.log('Message was delivered')
    })

})
const shareLocationButton=document.getElementById('send-location')

shareLocationButton.addEventListener('click',
    function(e){
    e.preventDefault()
        this.setAttribute('disabled','disabled')

        if(!navigator.geolocation){
            return alert('Geo Location is not supported by your browser')
        }
        navigator.geolocation.getCurrentPosition((position)=>{
            this.removeAttribute('disabled')
            socket.emit('sendLocationToServer',{latitude:position.coords.latitude,longitude:position.coords.longitude},()=>{
                console.log('location shared')
            })
        })
    })
socket.on('sendLocationToClient',(location)=>{
  //  console.log(location)
    const HTML=Mustache.render(locationTemplate,{
    url:location.url,
        createdAt:moment(location.createdAt).format('h:mm a')

    })
    newMessage.insertAdjacentHTML('beforeend',HTML)
})

socket.emit('join',{username,room},(error)=>{
    if(error){
          alert(error)
        location.href='/'
    }


})