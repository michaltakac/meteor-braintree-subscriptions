// Define gateway variable 
var gateway;

Meteor.startup(function () {
  var env;
  // Pick Braintree environment based on environment defined in Meteor settings.
  if (Meteor.settings.public.env === 'Production') {
    env = Braintree.Environment.Production;
  } else {
    env = Braintree.Environment.Sandbox;
  }
  // Initialize Braintree connection:
  gateway = BrainTreeConnect({
    environment: env,
    publicKey: Meteor.settings.public.BT_PUBLIC_KEY,
    privateKey: Meteor.settings.private.BT_PRIVATE_KEY,
    merchantId: Meteor.settings.public.BT_MERCHANT_ID
  });
});

Meteor.methods({
  getClientToken: function (clientId) {
    var generateToken = Meteor.wrapAsync(gateway.clientToken.generate, gateway.clientToken);
    var options = {};

    if (clientId) {
      options.clientId = clientId;
    }

    var response = generateToken(options);
    return response.clientToken;
  },
  createCustomer: function(){
    var user = Meteor.user();

    var customerData = {
      email: user.emails[0].address
    };
    // Because Braintree's API is asynchronous (meaning it doesn't block our function
    // from running once it's started), we can make use of Promises here.
    // This allows us to create a return object that "waits" for us to
    // return a value to it.
    var promise = new Promise(function(resolve) {
      // If current user is already a customer, return customer ID
      if (!!user.customerId) {
        resolve(user.customerId);
      } else {
        // Calling the Braintree API to create our customer!
        gateway.customer.create(customerData, function(error, response){
          if (error){
            resolve(error);
          } else {
            // If customer is successfuly created on Braintree servers,
            // we will now add customer ID to our User
            Meteor.users.update(user._id, {
              $set: {
                customerId: response.customer.id
              }
            });

            resolve(response.customer.id);
          }
        });
      }

    });

    return Promise.await(promise);
  },
  getCustomer: function(customerId) {
    // Create a Promise with a result from Braintree.
    var promise = new Promise(function(resolve) {

      // If all is well, call to the Braintree API to find our customer!
      gateway.customer.find(customerId, function(error, result) {
        if (error) {
          resolve(error);
        } else {
          resolve(result);
        }
      });

    });

    return Promise.await(promise);
  },
  createPaymentMethod: function(customerId, nonceFromTheClient) {
    // Create a Promise with a result from Braintree.
    var promise = new Promise(function(resolve) {

      // If all is well, call to the Braintree API to find our customer!
      gateway.paymentMethod.create({
        customerId: customerId, 
        paymentMethodNonce: nonceFromTheClient
      }, function(error, result) {
        if (error) {
          resolve(error);
        } else {
          resolve(result);
        }
      });

    });

    return Promise.await(promise);
  },
  createSubscription: function(data) {
    var user = Meteor.user();
    // Create a Promise with a result from Braintree.
    var promise = new Promise(function(resolve) {

      // Let's create subscription.
      gateway.subscription.create({
        paymentMethodToken: data.paymentMethodToken,
        planId: data.planId
      }, function (error, result) {
        if (error) { 
          resolve(error);
        } else {
          // Feed the result into Promise
          resolve(customerSubscription);

          // We store some info about subscription into object
          // which we'll inject into user.
          var customerSubscription = {
            subscriptionId: result.subscription.id,
            plan: {
              plan: result.subscription.planId,
              used: 0
            },
            nextPaymentDue: result.subscription.nextBillingDate,
            status: result.subscription.status
          }

          Meteor.users.update(user._id, {
            $set: {
              subscription: customerSubscription
            }
          });
          // When payment's successful, add "subscription-active"
          // role to current user.
          Roles.addUsersToRoles(user._id, 'subscription-active', Roles.GLOBAL_GROUP)
        }
      });
       
    });

    return Promise.await(promise);
  },
  getSubscription: function(subscriptionId) {
    // Create a Promise with a result from Braintree.
    var promise = new Promise(function(resolve) {

      // If all is well, we'll Braintree API to find our customer!
      gateway.subscription.find(subscriptionId, function(error, result) {
        if (error) {
          resolve(error);
        } else {
          resolve(result);
        }
      });

    });

    return Promise.await(promise);
  },
  getSubscriptionId: function(customerId) {
    // Create a Promise with a result from Braintree.
    var promise = new Promise(function (resolve) {

      // If all is well, we'll use Braintree API to find our customer!
      gateway.customer.find(customerId, function(error, result) {
        if (error) {
          resolve(error);
        } else {
          // Capture customer's subscriptionId here.
          var subscriptionId = result.paymentMethods[0].subscriptions.slice(-1)[0];
          // Retrieve subscriprion ID
          resolve(subscriptionId);
        }
      });

    });

    return Promise.await(promise);
  }
});