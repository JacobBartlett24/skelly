const clientId = 'ad34ee7e945b48349f261a4cf6d9006d';
const clientSecret = '71eae9aaed0d4840ab0509c5fcfc29af';
const redirectURI = 'http://127.0.0.1:5500/index.html';

var access_token = null;
var refresh_token = null;

const AUTHORIZE = 'https://accounts.spotify.com/authorize'
const TOKEN = 'https://accounts.spotify.com/api/token'
const PLAYLISTS = "https://api.spotify.com/v1/me/playlists";

function onPageLoad(){
    
    if(window.location.href.indexOf('code') > -1){
        let container = document.getElementById('container');
        let inputPageContainer = document.getElementById('inputPageContainer');
        inputPageContainer.style.display = 'grid'
        container.style.display = 'none'

        handleRedirect();
    }
}

window.onload = onPageLoad;

function handleRedirect(){
    let code = getCode();
    fetchAccessToken(code);
    window.history.pushState("","",redirectURI);
}

function getCode(){
    let code = null;
    const queryString = window.location.search;
    if(queryString.length > 0){
        const urlParams = new URLSearchParams(queryString);
        code = urlParams.get('code');
    }
    
    return code;
}

function fetchAccessToken( code ){
    let body = "grant_type=authorization_code";
    body += "&code=" + code; 
    body += "&redirect_uri=" + encodeURI(redirectURI);
    body += "&client_id=" + clientId;
    body += "&client_secret=" + clientSecret;
    
    callAuthorizationAPI(body);
    
}


function callAuthorizationAPI(body) {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(clientId + ":" + clientSecret));
    xhr.send(body);
    xhr.onload = handleAuthorizationResponse;
}

function handleAuthorizationResponse(){
    if(this.status == 200){
    var data = JSON.parse(this.responseText);
        console.log(data);
        var data = JSON.parse(this.responseText);
        if ( data.access_token != undefined ){
            access_token = data.access_token;
            
            localStorage.setItem("access_token", access_token);
        }
        if ( data.refresh_token  != undefined ){
            refresh_token = data.refresh_token;
            localStorage.setItem("refresh_token", refresh_token);
        }
        console.log(this.responseText)
        onPageLoad();
    } else{
        console.log(this.responseText)
        alert(this.responseText)
    }
}

function requestAuth(){
    localStorage.setItem("client_id",clientId)
    localStorage.setItem("client_secret",clientSecret)

    let url = AUTHORIZE;
    url += "?client_id=" + clientId;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirectURI);
    url += "&show_dialog=true";
    url += "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private";
    window.location.href = url; // Show Spotify's authorization screen
}

function logPlaylists(){
    callApi("GET",PLAYLISTS,null,handlePlaylistResponse)
}

function callApi(method, url, body, callback){
    let xhr = new XMLHttpRequest();
    
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
    xhr.send(body);
    xhr.onload = callback;
}

function handlePlaylistResponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data)
        data.items.forEach(item => addPlaylist(item));
    }
    else if ( this.status == 401 ){
        refreshAccessToken()
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function addPlaylist(item){
    let playlistContainer = document.createElement('div');
    let playlist = document.createElement("div");
    let cover = document.createElement('img');

    playlistContainer.className = 'playlistContainer'

    cover = createCover(cover, item);
    playlist = createPlaylist(playlist, item);

    playlistContainer.appendChild(cover);
    playlistContainer.appendChild(playlist);

    document.getElementById('playlistWrapper').appendChild(playlistContainer);
}

function createPlaylist(playlist, item) {
    let TRACKS = `https://api.spotify.com/v1/playlists/${item.id}/tracks?limit=10`
    callApi("GET",TRACKS,null,handlePlaylistTrackReponse)

    playlist.classList.add('playlist');
    playlist.id = item.id;
    playlist.innerText = item.name;

    return playlist;
}

function addPlaylistTracks(item){
    let playListID = item.href.split('/')[5]
    let playlist = document.getElementById(playListID)
    let songs = document.createElement('ol')
    songs.class = 'songs'
    item.items.forEach(track => addTrack(songs,track.track.name))

    playlist.append(songs)
}

function addTrack(songs,track){
    let trackElement = document.createElement('li')
    trackElement.innerText = track

    songs.appendChild(trackElement)
}

function handlePlaylistTrackReponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        addPlaylistTracks(data)
    }
    else if ( this.status == 401 ){
        refreshAccessToken()
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function createCover(cover, item) {
    cover.classList.add('cover');
    cover.style.width = '200px';
    cover.style.height = '200px';
    if (item.images.length != 0) {
        cover.src = item.images[0].url;
    }
    return cover;
}

function refreshAccessToken(){
    refresh_token = localStorage.getItem("refresh_token");
    let body = "grant_type=refresh_token";
    body += "&refresh_token=" + refresh_token;
    body += "&client_id=" + clientId;
    callAuthorizationAPI(body);
}

function navigateToPastPlaylistPage(){
    let inputPageContainer = document.getElementById('inputPageContainer');
    inputPageContainer.style.display = 'none'
    let pastPlaylistContainer = document.getElementById('pastPlaylistContainer')
    pastPlaylistContainer.style.display = 'grid';
    populatePastPlaylistPage()
}

function navigateToMainPage(e){
    let inputPageContainer = document.getElementById('inputPageContainer');
    inputPageContainer.style.display = 'grid'
    let pastPlaylistContainer = document.getElementById('pastPlaylistContainer')
    pastPlaylistContainer.style.display = 'none';
    
}

function populatePastPlaylistPage(){
    let playlistWrapper = document.getElementById('playlistWrapper')
    if(!playlistWrapper.hasChildNodes()){
        callApi("GET",PLAYLISTS,null,handlePlaylistResponse)
    }
}
