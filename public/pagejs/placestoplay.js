function getQueriesForDocumentsAround(ref, center, radiusInKm) {
    var geohashesToQuery = geohashQueries([center.latitude, center.longitude], radiusInKm * 1000);
    console.log(JSON.stringify(geohashesToQuery));
    return geohashesToQuery.map(function (location) {
        return ref.where("geohash", ">=", location[0]).where("geohash", "<=", location[1]);
    });
}

document.addEventListener('firebaseuserchange', function () {
    console.log('login changed so ready for input');

    var map;
    var center = new firebase.firestore.GeoPoint(51.5, -2.6);
    var searchRadius = 25;
    var mapElement = document.getElementById('map');
    mapElement.innerHTML = "";

    // there is a user, this is the document we want to change
    var locationsRef = firebase.firestore().collection("locations");

    var queries = getQueriesForDocumentsAround(locationsRef, center, searchRadius);
    queries.forEach(function (query) {
        query.get().then(function (querySnapshot) {
            if (!map) {
                map = new google.maps.Map(mapElement, {
                    center: {
                        lat: center.latitude,
                        lng: center.longitude
                    },
                    zoom: 8
                });
            }
            querySnapshot.forEach(function (doc) {
                var data = doc.data();
                // we can calc the distance and show only those within range
                var dist = distance(
                    [center.latitude, center.longitude], 
                    [data.location.latitude, data.location.longitude]);
                // have the actual distance this is from the center - because we can get things too far away...
                if (dist <= searchRadius) {
                    var marker = new google.maps.Marker({
                        position: new google.maps.LatLng(data.location.latitude, data.location.longitude),
                        map: map,
                        icon: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                        title: data.user_name
                    });
                }
            });
        });
    })
});