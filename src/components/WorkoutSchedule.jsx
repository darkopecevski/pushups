import React from 'react';

const WorkoutSchedule = () => (
  <section className="card" style={{ marginBottom: 'var(--spacing-xl)', padding: 'var(--spacing-md)' }}>
    <h2>Weekly Workout Schedule</h2>
    <p style={{ marginBottom: 32, color: '#717171' }}>
      <strong>Schedule:</strong> Mon, Tue, Thu, Fri (40-50 min) | <strong>Time:</strong> 7:30 AM | 
      <strong>Wednesday:</strong> Rest | <strong>Weekends:</strong> Outdoor activities
    </p>
    <div className="workout-plan">
      <div className="workout-day">
        <div className="day-title">💪 Monday - Upper Body Power</div>
        <div className="exercise"><div><div className="exercise-name">Barbell Bench Press</div><div className="exercise-details">Weeks 1-3: 75-80kg | 4 sets × 4-6 reps</div></div></div>
        <div className="exercise"><div><div className="exercise-name">Bent-Over Barbell Row</div><div className="exercise-details">Weeks 1-3: 60-65kg | 4 sets × 4-6 reps</div></div></div>
        <div className="exercise"><div><div className="exercise-name">Overhead Press</div><div className="exercise-details">Weeks 1-3: 45-50kg | 3 sets × 5-6 reps</div></div></div>
        <div className="exercise"><div><div className="exercise-name">Pull-ups/Assisted</div><div className="exercise-details">Weeks 1-3: Bodyweight | 3 sets × 4-8 reps</div></div></div>
        <div className="exercise"><div><div className="exercise-name">Incline Dumbbell Press</div><div className="exercise-details">Weeks 1-3: 25-28kg each | 3 sets × 6-8 reps</div></div></div>
        <div className="exercise"><div><div className="exercise-name">Barbell Curls</div><div className="exercise-details">Weeks 1-3: 30-35kg | 3 sets × 6-8 reps</div></div></div>
        <div className="exercise"><div><div className="exercise-name">Close-Grip Bench Press</div><div className="exercise-details">Weeks 1-3: 55-60kg | 3 sets × 6-8 reps</div></div></div>
      </div>
      <div className="workout-day">
        <div className="day-title">🦵 Tuesday - Lower Body Foundation</div>
        <div className="exercise"><div><div className="exercise-name">Back Squats</div><div className="exercise-details">Weeks 1-3: 55-60kg | 4 sets × 4-6 reps</div></div></div>
        <div className="exercise"><div><div className="exercise-name">Romanian Deadlifts</div><div className="exercise-details">Weeks 1-3: 50-55kg | 4 sets × 6-8 reps</div></div></div>
        <div className="exercise"><div><div className="exercise-name">Bulgarian Split Squats</div><div className="exercise-details">Weeks 1-3: 15-18kg each | 3 sets × 8-10 each</div></div></div>
        <div className="exercise"><div><div className="exercise-name">Hip Thrusts</div><div className="exercise-details">Weeks 1-3: 60-70kg | 3 sets × 10-12 reps</div></div></div>
        <div className="exercise"><div><div className="exercise-name">Leg Press</div><div className="exercise-details">Weeks 1-3: 100-120kg | 3 sets × 10-12 reps</div></div></div>
        <div className="exercise"><div><div className="exercise-name">Calf Raises</div><div className="exercise-details">Weeks 1-3: 80-90kg | 3 sets × 12-15 reps</div></div></div>
        <div className="exercise"><div><div className="exercise-name">Plank</div><div className="exercise-details">Weeks 1-3: Bodyweight | 3 sets × 45-60s</div></div></div>
      </div>
      <div className="workout-day">
        <div className="day-title">🚫 Wednesday - Rest Day</div>
        <div className="exercise"><div><div className="exercise-name">Complete Rest or Light Activity</div><div className="exercise-details">24h Fast Day | Optional: 20-minute walk, yoga, stretching</div></div></div>
        <div className="exercise"><div><div className="exercise-name">10km Biking</div><div className="exercise-details">Continue daily biking routine at light pace</div></div></div>
      </div>
      <div className="workout-day">
        <div className="day-title">💪 Thursday - Upper Body Volume</div>
        <div className="exercise"><div><div className="exercise-name">Incline Barbell Press</div><div className="exercise-details">Weeks 1-3: 65-70kg | 4 sets × 4-6 reps</div></div></div>
        <div className="exercise"><div><div className="exercise-name">Seated Cable Row</div><div className="exercise-details">Weeks 1-3: 70-75kg | 4 sets × 5-6 reps</div></div></div>
        <div className="exercise"><div><div className="exercise-name">Dumbbell Shoulder Press</div><div className="exercise-details">Weeks 1-3: 20-22kg each | 3 sets × 6-8 reps</div></div></div>
        <div className="exercise"><div><div className="exercise-name">Wide-Grip Pulldowns</div><div className="exercise-details">Weeks 1-3: 60-65kg | 3 sets × 6-8 reps</div></div></div>
        <div className="exercise"><div><div className="exercise-name">Decline Bench Press</div><div className="exercise-details">Weeks 1-3: 60-65kg | 3 sets × 6-8 reps</div></div></div>
        <div className="exercise"><div><div className="exercise-name">Preacher Curls</div><div className="exercise-details">Weeks 1-3: 25-30kg | 3 sets × 8-10 reps</div></div></div>
        <div className="exercise"><div><div className="exercise-name">Skull Crushers</div><div className="exercise-details">Weeks 1-3: 30-35kg | 3 sets × 8-10 reps</div></div></div>
      </div>
      <div className="workout-day">
        <div className="day-title">🦵 Friday - Lower Body Power</div>
        <div className="exercise"><div><div className="exercise-name">Conventional Deadlifts</div><div className="exercise-details">Weeks 1-3: 55-60kg | 4 sets × 5-6 reps</div></div></div>
        <div className="exercise"><div><div className="exercise-name">Front Squats</div><div className="exercise-details">Weeks 1-3: 45-50kg | 4 sets × 6-8 reps</div></div></div>
        <div className="exercise"><div><div className="exercise-name">Single-Leg Romanian Deadlifts</div><div className="exercise-details">Weeks 1-3: 15-18kg each | 3 sets × 8-10 each</div></div></div>
        <div className="exercise"><div><div className="exercise-name">Leg Press</div><div className="exercise-details">Weeks 1-3: 120-140kg | 3 sets × 10-12 reps</div></div></div>
        <div className="exercise"><div><div className="exercise-name">Leg Curls</div><div className="exercise-details">Weeks 1-3: 30-35kg | 3 sets × 10-12 reps</div></div></div>
        <div className="exercise"><div><div className="exercise-name">Seated Calf Raises</div><div className="exercise-details">Weeks 1-3: 50-60kg | 3 sets × 12-15 reps</div></div></div>
        <div className="exercise"><div><div className="exercise-name">Dead Bug</div><div className="exercise-details">Weeks 1-3: Bodyweight | 3 sets × 10 each side</div></div></div>
      </div>
    </div>
    <style jsx>{`
      .workout-plan {
        margin-top: 2rem;
      }
      .workout-day {
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: #f7f7f7;
        border-radius: 16px;
        border: 1px solid #e6e6e6;
      }
      .day-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #222;
        margin-bottom: 1rem;
      }
      .exercise {
        margin-bottom: 1.25rem;
        padding: 1.25rem;
        background: #fff;
        border-radius: 12px;
        border: 1px solid #e6e6e6;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
      }
      .exercise-name {
        font-weight: 600;
        color: #222;
        margin-bottom: 0.5rem;
        font-size: 1rem;
      }
      .exercise-details {
        font-size: 0.95rem;
        color: #484848;
      }
    `}</style>
  </section>
);

export default WorkoutSchedule; 