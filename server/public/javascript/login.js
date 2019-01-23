
window.onload = function() {
    if(sessionStorage.islogin != undefined && sessionStorage.islogin == 'true') {
        const IAPCONFIG = JSON.parse(sessionStorage.LOGININFO);
        location.href = `/${IAPCONFIG.auth[0]}.html`;
    } else {
        // document.querySelector('section').removeAttribute('class');
    }

    document.querySelector('#wa_login_submit').addEventListener('click', function(e) {
        let username = document.querySelector('#wa_login_username').value.trim();
        let psd = document.querySelector('#wa_login_psd').value;
        if(username.length > 0 && psd.length > 0) {
            postBody.body = JSON.stringify({
                username: username,
                psd: psd
            });
            
            fetch(APIHOST+'/login', postBody).then(e => e.json()).then(res => {
                if(res.code == 0 && res.user.length > 0) {
                    sessionStorage.setItem('islogin','true');
                    sessionStorage.setItem('LOGININFO',JSON.stringify(res.user[0]));
                    location.href = `/${res.user[0].auth[0]}.html`;
                } else {
                    document.querySelector('#wa_login_alert').removeAttribute('class');
                }
            });
        }
    });
}