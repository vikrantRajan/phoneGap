var dbSize = 5 * 1024 * 1024;
var db;
var map;

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -34.397, lng: 150.644},
    zoom: 8
  });
}

function cleanUpTempPhotos() {
    navigator.camera.cleanup(onSuccess, onFail);

    function onSuccess() {
        alert("Camera cleanup success.")
    }

    function onFail(message) {
        alert('Failed because: ' + message);
    }
}

function encodeImageUri(imageUri)
{
     var c=document.createElement('canvas');
     var ctx=c.getContext("2d");
     var img=new Image();
     img.onload = function(){
       c.width=this.width;
       c.height=this.height;
       ctx.drawImage(img, 0,0);
     };
     img.src=imageUri;
     var dataURL = c.toDataURL("image/jpeg");
     return dataURL;
} 
var app = {

    initialize: function() {
        this.bindEvents();
    },
    
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    
    receivedEvent: function(readyText) {
        
        function onGeoSuccess(position) {
            let coords = { 'lat': position.coords.latitude, 'long': position.coords.longitude };
            localStorage.setItem('currentPosition', JSON.stringify(coords));
            console.log(coords);
            
            var myLatLng = {lat: coords.lat, lng: coords.long};

            var map = new google.maps.Map(document.getElementById('map'), {
              zoom: 20,
              center: myLatLng
            });
    
            var marker = new google.maps.Marker({
              position: myLatLng,
              map: map,
              title: 'My Location'
            });
        }

        function onGeoError(error) {
            alert('code: '    + error.code    + '\n' +
                'message: ' + error.message + '\n');
        }

        // Options: throw an error if no update is received every 30 seconds.
        geoOpts = { maximumAge: 0, timeout: 5000, enableHighAccuracy: true};
        var watchID = navigator.geolocation.watchPosition(onGeoSuccess, onGeoError, geoOpts);

        var options = new ContactFindOptions();
        options.filter="";          // empty search string returns all contacts
        options.multiple=true;      // return multiple results
        filter = ["displayName"];   // return contact.displayName field

        // find contacts
        navigator.contacts.find(filter, onSuccess, onError, options);

        // onSuccess: Get a snapshot of the current contacts
        //
        function onSuccess(contacts) {
            for (var i=0; i<contacts.length; i++) {
                if (contacts[i].phoneNumbers) {  // many contacts don't have displayName
                    console.log(contacts[i].phoneNumbers);
                    let name = contacts[i].displayName;
                    try {
                        name = contacts[i].name.givenName;
                    }
                    catch{
                        console.log('Unable to find givenName')
                    }
                    insertPhonebookRow(name, contacts[i].phoneNumbers[0].value);
                    if (i == 20) break;
                }
            }
            alert('contacts loaded');
        }
        
        function onError(err){
            console.log(err);
        }

        async function displayContacts(tx, results){
            return new Promise((resolve, reject) => {
                var list = $("#contactListLi");
                list.empty();

                console.log(results.rows);

                var len = results.rows.length, i;
                for (i = 0; i < len; i++) {
                    list.append(`<li><a class="editContact" data-id="${results.rows.item(i).ID}">${results.rows.item(i).strFullName}</li>`);
                }

                $("#contactListLi").listview("refresh");
                resolve();
            });

        }

        async function displayPhoneContacts(tx, results){
            return new Promise((resolve, reject) => {
                var list = $("#phoneContactsListLi");
                list.empty();

                console.log(results.rows);

                var len = results.rows.length, i;
                for (i = 0; i < len; i++) {
                    list.append(`<li><a class="displayContactList" data-id="${results.rows.item(i).ID}">${results.rows.item(i).strFullName}</li>`);
                }

                $("#phoneContactsListLi").listview("refresh");
                resolve();
            });

        }
        async function insertRow(field1, field2){
            return new Promise(function(resolve, reject){
                db = openDatabase("contactapp", "1", "Contact App", dbSize);
    
                db.transaction(function(tx) {
                    tx.executeSql("CREATE TABLE IF NOT EXISTS " +
                            "contacts(ID INTEGER PRIMARY KEY ASC, strFullName, strEmail, strPhone, strPicture)");
                });
    
                // save our form to websql
                db.transaction(function(tx){
                    let contactName = field1;
                    let contactEmail = field2;
                    tx.executeSql(`INSERT INTO contacts(strFullName, strEmail) VALUES (?,?)`, [contactName, contactEmail], (tx, res)=>{
                        console.log(res);
                        resolve(res);
                    });  
                });
            });
            
        }

        async function insertPhonebookRow(field1, field2){
            return new Promise(function(resolve, reject){
                db = openDatabase("contactapp", "1", "Contact App", dbSize);
    
                db.transaction(function(tx) {
                    tx.executeSql("CREATE TABLE IF NOT EXISTS " +
                            "phonebook(ID INTEGER PRIMARY KEY ASC, strFullName, strPhone)");
                });
    
                // save our form to websql
                db.transaction(function(tx){
                    tx.executeSql(`INSERT INTO phonebook(strFullName, strPhone) VALUES (?,?)`, [field1, field2], (tx, res)=>{
                        console.log(res);
                        resolve(res);
                    });  
                });
            });
            
        }
        function openDBandLoadContacts(){
            db = openDatabase("contactapp", "1", "Contact App", dbSize);
            db.transaction(function(tx){
                tx.executeSql("SELECT * FROM contacts",[], async (tx, results)=>{
                    await displayContacts(null, results);
                    $(".editContact").bind( "tap", async (event) =>{
                        let record = await fetchRowFromContacts(event.target.getAttribute('data-id'));
                        $("#editContactId").val(record.ID);
                        $("#editContactName").val(record.strFullName);
                        $("#editContactEmail").val(record.strEmail);
                        $("body").pagecontainer("change", "#editContactPage");
                    });
                });
            });
        }

        async function fetchRowFromContacts(id){
            return new Promise((resolve, reject)=>{
                db = openDatabase("contactapp", "1", "Contact App", dbSize);
                db.transaction(function(tx){
                    tx.executeSql(`SELECT * FROM contacts where ID = ?`,[id], (tx, results)=>{
                        resolve(results.rows.item(i));
                    });
                });
            });
        }

        async function fetchRowFromPhoneContacts(id){
            return new Promise((resolve, reject)=>{
                db = openDatabase("contactapp", "1", "Contact App", dbSize);
                db.transaction(function(tx){
                    tx.executeSql(`SELECT * FROM phonebook where ID = ?`,[id], (tx, results)=>{
                        resolve(results.rows.item(i));
                    });
                });
            });
        }

        async function updateContactsRow(data){
            return new Promise((resolve, reject) =>{
                db = openDatabase("contactapp", "1", "Contact App", dbSize);
                db.transaction( (tx) =>{
                    tx.executeSql('UPDATE contacts SET strFullName=?, strEmail= ? WHERE id=?', [data.strFullName, data.strEmail, data.id], (tx, res) =>{
                        resolve(res);
                    });
                });
            });
        }

        $(document).ready(function(){     
            $("#saveNewContact").bind( "tap", tapHandler );
            $("#saveEditContact").bind( "tap", saveEditHandler );
            $("#captureSelfie").bind( "tap", captureSelfie );
            $("#cleanupSelfies").bind( "tap", cleanUpTempPhotos );

            openDBandLoadContacts();

            function captureSelfie(){

                navigator.camera.getPicture(onSuccess, onFail, 
                    { 
                        quality: 50,
                        destinationType: Camera.DestinationType.FILE_URI,
                        cameraDirection: Camera.Direction.FRONT
                    });
            
                function onSuccess(imageURI) {
                    var image = document.getElementById('selfie');
                    image.src = imageURI;
                    console.log(encodeImageUri(imageURI));
                }
                
                function onFail(message) {
                    alert('Failed because: ' + message);
                }
            } 

            async function tapHandler( event ){
                await insertRow($("#contactName").val(), $("#contactEmail").val());
                $("body").pagecontainer("change", "#home");
            }

            async function saveEditHandler (event){
                let result = await updateContactsRow({
                    'id': $('#editContactId').val(), 
                    'strFullName': $('#editContactName').val(), 
                    'strEmail': $('#editContactEmail').val()
                });
                $("body").pagecontainer("change", "#home");
            }
        
            $(document).on( 'pagebeforeshow' , '#home' ,function(event){
                openDBandLoadContacts();
            }); 

            $(document).on( 'pagebeforeshow' , '#phonebook' ,function(event){
                db = openDatabase("contactapp", "1", "Contact App", dbSize);
                db.transaction(function(tx){
                    tx.executeSql("SELECT * FROM phonebook",[], async (tx, results)=>{
                        await displayPhoneContacts(null, results);
                        $('.displayContactList').bind('tap', async (event) => {
                            let record = await fetchRowFromPhoneContacts(event.target.getAttribute('data-id'));
                            await insertRow(record.strFullName, record.strPhone);
                            $('body').pagecontainer("change", "#home");

                        })
                    });
                });
            });
            
       
        });
    }
};
