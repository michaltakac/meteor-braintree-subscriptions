Meteor.publish("items", function() {
  if ( Roles.userIsInRole(this.userId, 'subscription-active') ) {
    return Items.find();
  }
});
