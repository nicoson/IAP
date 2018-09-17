if(sessionStorage.islogin != undefined && sessionStorage.islogin == 'true') {
    location.href = '/list.html';
} else {
    // document.querySelector('section').removeAttribute('class');
}

let userlist = {
    admin: 'admin',
    wajsk: 'wajsk'
}

document.querySelector('#wa_login_submit').addEventListener('click', function(e) {
    let user = document.querySelector('#wa_login_username').value.trim();
    let psd = document.querySelector('#wa_login_psd').value.trim()
    if(userlist[user] == psd) {
        sessionStorage.setItem('islogin','true');
        location.href = '/list.html';
    } else {
        document.querySelector('#wa_login_alert').removeAttribute('class');
    }
});