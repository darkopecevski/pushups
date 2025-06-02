import React, { useState } from 'react';
import ProgressTracker from './ProgressTracker.jsx';
import MealPlan from './MealPlan.jsx';
import WorkoutSchedule from './WorkoutSchedule.jsx';
import ShoppingList from './ShoppingList.jsx';
import PlanOverview from './PlanOverview.jsx';
import Tabs from './Tabs.jsx';

const PlanTabs = ({ tabs, user, profile }) => {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  return (
    <>
      <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === 'progress' && <ProgressTracker user={user} profile={profile} />}
      {activeTab === 'meals' && <MealPlan user={user} profile={profile} />}
      {activeTab === 'workouts' && <WorkoutSchedule user={user} profile={profile} />}
      {activeTab === 'shopping' && <ShoppingList user={user} profile={profile} />}
      {activeTab === 'overview' && <PlanOverview user={user} profile={profile} />}
    </>
  );
};

export default PlanTabs; 