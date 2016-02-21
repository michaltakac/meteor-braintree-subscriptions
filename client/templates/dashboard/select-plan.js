Template.selectPlan.onRendered(function() {
  // A little UX touch, set the first plan in our list to be selected. We can
  // change this to any item in the list, so for fancy folks you could have this
  // be selected based on real metrics for your most popular plan :)
  var firstPlanItem = $('.select-plan a:first-child');
  firstPlanItem.addClass('active');
  firstPlanItem.find('input').prop("checked", true);
  Session.set('planId', 'Standard');
});

Template.selectPlan.helpers({
  plans: function(){
    var getPlans = Meteor.settings.public.plans;
    var userId   = Meteor.userId();

    var items = Items.find({owner: userId}).fetch();

    // If user has more than 5 items created and cancels subscription,
    // he can only resubscribe for higher tier subscription until he
    // cuts items count to 5.
    if (items.length > 5) {
      return _.where(getPlans, {limit: 15});
    } else {
      return getPlans;
    }
  }
});

/*
* Events
*/

Template.selectPlan.events({
  'click .list-group-item': function(e) {
    var parent = $(e.target).closest('.list-group-item');
    parent.addClass("active");
    $('.list-group-item').not(parent).removeClass("active");
    parent.find('input[type="radio"]').prop("checked", true);
    var planId = parent.find('input[type="radio"]').attr('data-plan');
    console.log(planId);
    Session.set('planId', planId);
  }
});