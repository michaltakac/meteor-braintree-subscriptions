Template.dashboard.onCreated(function() {
  var instance = this;
  instance.autorun(function() {
    instance.subscribe('items');
  });
});

Template.dashboard.onRendered(function() {
  var user = Meteor.user();
  
  if (user && !user.customerId) {
    Meteor.call('getClientToken', function(error, clientToken) {
      if (error) {
        console.log(error);
      } else {
        braintree.setup(clientToken, "dropin", {
          // Injecting into <div id="payment-form"></div>
          container: "payment-form",
          onPaymentMethodReceived: function (response) {
            // When we submit the form, we'll capture
            // nonce from Braintree.
            var nonce = response.nonce;
            var customerId = null;
            
            Meteor.promise('createCustomer')
              .then(function(id) {
                return Meteor.promise('createPaymentMethod', id, nonce);
              })
              .then(function(data) {

                var subscription = {
                  planId: Session.get('planId'),
                  paymentMethodToken: data.paymentMethod.token
                };

                Meteor.call('createSubscription', subscription);
              });

          }
        });
      }
    });
  }
});


Template.dashboard.helpers({
  items: function(){
    return Items.find();
  },
  showForm: function() {
    var userId = Meteor.userId();
    return !Roles.userIsInRole(userId, 'subscription-active');
  },
  isSubscriptionCanceled: function() {
    var userId = Meteor.userId();
    return Roles.userIsInRole(userId, 'subscription-inactive')
  }
});