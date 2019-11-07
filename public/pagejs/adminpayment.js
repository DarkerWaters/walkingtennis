var app;

function populateUserData() {
    // fill this page with our data now
    Stripe.setPublishableKey('pk_test_PuaOWiLDgsiSeV5ybYo4nT6a00vRQLlhIF');
    app = new Vue({
        el: '#app',
        data: {
            currentUser: null,
            sources: {},
            stripeCustomerInitialized: false,
            newCreditCard: {
                number: '4242424242424242',
                cvc: '111',
                exp_month: 1,
                exp_year: 2020,
                address_zip: '00000'
            },
            charges: {},
            newCharge: {
                source: null,
                amount: 2000
            }
        },
        ready: () => {},
        methods: {
            listen: function () {
                firebase.firestore().collection('users').doc(`${this.currentUser.uid}`).onSnapshot(snapshot => {
                    this.stripeCustomerInitialized = (snapshot.data() !== null);
                }, () => {
                    this.stripeCustomerInitialized = false;
                });
                firebase.firestore().collection('users').doc(`${this.currentUser.uid}`).collection('stripe_sources').onSnapshot(snapshot => {
                    let newSources = {};
                    snapshot.forEach(doc => {
                        const id = doc.id;
                        newSources[id] = doc.data();
                    })
                    this.sources = newSources;
                }, () => {
                    this.sources = {};
                });
                firebase.firestore().collection('users').doc(`${this.currentUser.uid}`).collection('stripe_charges').onSnapshot(snapshot => {
                    let newCharges = {};
                    snapshot.forEach(doc => {
                        const id = doc.id;
                        newCharges[id] = doc.data();
                    })
                    this.charges = newCharges;
                }, () => {
                    this.charges = {};
                });
            },
            submitNewCreditCard: function () {
                Stripe.card.createToken({
                    number: this.newCreditCard.number,
                    cvc: this.newCreditCard.cvc,
                    exp_month: this.newCreditCard.exp_month,
                    exp_year: this.newCreditCard.exp_year,
                    address_zip: this.newCreditCard.address_zip
                }, (status, response) => {
                    if (response.error) {
                        this.newCreditCard.error = response.error.message;
                    } else {
                        firebase.firestore().collection('users').doc(this.currentUser.uid).collection('stripe_tokens').add({
                            token: response.id
                        }).then(() => {
                            this.newCreditCard = {
                                number: '',
                                cvc: '',
                                exp_month: 1,
                                exp_year: 2017,
                                address_zip: ''
                            };
                        });
                    }
                });
            },
            submitNewCharge: function () {
                firebase.firestore().collection('users').doc(this.currentUser.uid).collection('stripe_charges').add({
                    source: this.newCharge.source,
                    amount: parseInt(this.newCharge.amount)
                });
            }
        }
    });
}

document.addEventListener('firebaseuserchange', function () {
    console.log('login changed so ready for input');

    populateUserData();

    var firebaseUser = firebaseData.getUser();
    if (firebaseUser) {
        app.currentUser = firebaseUser;
        app.listen();
    } else {
        app.currentUser = null;
    }
});