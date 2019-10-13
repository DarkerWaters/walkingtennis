function showMapForState(state, MAX_DISTANCE) {
    var map;
    var resultCount = 0,
        totalDistanceKm = 0,
        matchCount = 0,
        matchDistanceKm = 0,
        docs = {},
        maxDistanceKm = 0;
    var center = states[state].capital.location;
    document.getElementById('map').innerHTML = "";

    var queries = getQueriesForDocumentsAround(collection, center, MAX_DISTANCE);
    queries.forEach(function (query) {
        query.get().then(function (querySnapshot) {
            if (!map) {
                map = new google.maps.Map(document.getElementById('map'), {
                    center: {
                        lat: center.lat,
                        lng: center.lon
                    },
                    zoom: 8
                });
            }
            querySnapshot.forEach(function (doc) {
                var data = doc.data();
                resultCount++;
                var dist = distance([center.lat, center.lon], [data.location.latitude, data.location.longitude]);
                if (dist <= MAX_DISTANCE && !docs[doc.id]) {
                    docs[doc.id] = doc.data();
                    matchCount++;
                    matchDistanceKm += dist;
                    //console.log("This one is IN range: "+data.location.latitude+","+data.location.longitude);
                }
                totalDistanceKm += dist;
                if (dist > maxDistanceKm) {
                    maxDistanceKm = dist;
                }
                //console.log(doc.id+": "+data.location.latitude+","+data.location.longitude+" at "+dist);
                var marker = new google.maps.Marker({
                    position: new google.maps.LatLng(data.location.latitude, data.location.longitude),
                    map: map,
                    icon: 'https://maps.google.com/mapfiles/ms/icons/' + (dist <= MAX_DISTANCE ? 'green' : 'red') + '-dot.png',
                    title: doc.id
                });
            });
            console.log("The total " + resultCount + " query results are a total of " + Math.round(totalDistanceKm) + "km from the center, docs.length=" + Object.keys(docs).length + " matchCount=" + matchCount + " matchDistance=" + Math.round(matchDistanceKm) + "km");
            summaryElm.innerText = "The total " + resultCount + " query results are a total of " + Math.round(totalDistanceKm) + "km from the center, docs.length=" + Object.keys(docs).length + " matchCount=" + matchCount + " matchDistance=" + Math.round(matchDistanceKm) + "km";
            //console.log(docs);
        });
    })
}

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
    document.getElementById('map').innerHTML = "";

    // there is a user, this is the document we want to change
    var locationsRef = firebase.firestore().collection("locations");

    var queries = getQueriesForDocumentsAround(locationsRef, center, searchRadius);
    queries.forEach(function (query) {
        query.get().then(function (querySnapshot) {
            if (!map) {
                map = new google.maps.Map(document.getElementById('map'), {
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
                    [data.home_location.latitude, data.home_location.longitude]);
                // have the actual distance this is from the center - because we can get things too far away...
                if (dist <= searchRadius) {
                    var marker = new google.maps.Marker({
                        position: new google.maps.LatLng(data.home_location.latitude, data.home_location.longitude),
                        map: map,
                        icon: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                        title: data.user_name
                    });
                }
            });
        });
    })
});