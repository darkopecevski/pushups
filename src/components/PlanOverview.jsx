import React from 'react';

const PlanOverview = () => (
  <section className="card" style={{ marginBottom: 'var(--spacing-xl)', padding: 'var(--spacing-md)' }}>
    <h2>Plan Overview & Guidelines</h2>
    <div className="plan-overview">
      <div className="meal-day">
        <div className="day-title">🎯 Key Success Factors</div>
        <div className="meal">
          <div className="meal-content">
            <strong>1. Consistency is Everything:</strong> Never miss meals or workouts without valid reason<br />
            <strong>2. Egg-Based Breakfast:</strong> Provides sustained energy for fasted training<br />
            <strong>3. Oats + Whey Combination:</strong> Perfect muscle-building meal<br />
            <strong>4. Progressive Overload:</strong> Building from your current strength levels<br />
            <strong>5. Adequate Cardio:</strong> Your 10km biking is perfect - don't overdo it<br />
            <strong>6. Recovery Focus:</strong> Sleep, hydration, stress management<br />
            <strong>7. Meal Timing:</strong> 16h fasting window helps accelerate fat loss
          </div>
        </div>
      </div>
      <div className="meal-day">
        <div className="day-title">📊 Expected Results Timeline</div>
        <div className="meal">
          <div className="meal-content">
            <strong>Week 1:</strong> -2.0kg (includes water weight) | Adjustment period<br />
            <strong>Week 2:</strong> -1.5kg | Energy improving<br />
            <strong>Week 3:</strong> -1.0kg | Noticeable strength improvement<br />
            <strong>Week 4:</strong> -1.0kg | Clear strength gains<br />
            <strong>Week 5:</strong> -1.0kg | Peak performance period<br />
            <strong>Week 6:</strong> -1.5kg | Maintaining very well<br />
            <strong>Week 7:</strong> -1.0kg | Metabolic training phase<br />
            <strong>Week 8:</strong> -1.0kg | Endurance improving<br />
            <strong>Week 9:</strong> -1.0kg | Final push to goal<br /><br />
            <strong>Total Expected:</strong> 10-11kg weight loss | 4-5% body fat reduction
          </div>
        </div>
      </div>
      <div className="meal-day">
        <div className="day-title">🚨 Critical Rules</div>
        <div className="meal">
          <div className="meal-content">
            <strong>✅ DO:</strong><br />
            • Drink 3.5-4 liters of water daily<br />
            • Sleep 2-3 hours after last meal<br />
            • Take progress photos weekly<br />
            • Measure at same time each week<br />
            • Continue 10km daily biking<br /><br />
            <strong>❌ DON'T:</strong><br />
            • Skip any meals during eating window<br />
            • Drink alcohol for the full 9 weeks<br />
            • Have cheat meals<br />
            • Substitute proteins for carbs or vice versa<br />
            • Add extra cardio (your biking is enough)
          </div>
        </div>
      </div>
      <div className="meal-day">
        <div className="day-title">🔄 Adjustment Protocols</div>
        <div className="meal">
          <div className="meal-content">
            <strong>If weight loss stalls (week 5+):</strong> Reduce carbs by 20g or add 2k steps<br />
            <strong>If strength drops significantly:</strong> Increase calories by 100-150 for 3 days<br />
            <strong>If fatigue increases:</strong> Take extra rest day or reduce cardio intensity<br />
            <strong>If hunger is overwhelming:</strong> Add 100g vegetables to any meal<br />
            <strong>If workout performance suffers:</strong> Consider 5g creatine daily
          </div>
        </div>
      </div>
      <div className="meal-day">
        <div className="day-title">📱 Daily Activity Targets</div>
        <div className="meal">
          <div className="meal-content">
            <strong>Monday/Tuesday/Thursday/Friday:</strong> 6,000 steps + gym + 10km biking<br />
            <strong>Wednesday:</strong> 8,000 steps + 10km biking (rest day)<br />
            <strong>Saturday/Sunday:</strong> 10,000 steps + 10km biking + outdoor activities<br /><br />
            <strong>Weekly Total:</strong> ~47,000 steps + 70km biking + 4 gym sessions
          </div>
        </div>
      </div>
    </div>
    <style jsx>{`
      .plan-overview {
        margin-top: 2rem;
      }
      .meal-day {
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
      .meal {
        margin-bottom: 1.25rem;
        padding: 1.25rem;
        background: #fff;
        border-radius: 12px;
        border: 1px solid #e6e6e6;
      }
      .meal-content {
        font-size: 0.95rem;
        line-height: 1.6;
        color: #484848;
      }
    `}</style>
  </section>
);

export default PlanOverview; 