# Weight tracker

Here are the functionalities that the timer needs to have:

1. Stopwatch
- User should be able to configure: 
    - Prepare phase (set time in seconds to use as a countdown before they start with the workout)
    - Time cap - Clock should stop at this time
    

2. AMRAP (as many rounds as possible)
- User should be able to configure: 
    - Prepare phase (set time in seconds to use as a countdown before they start with the workout)
    - Start time - Total duration of workout

3. Tabata
- User should be able to configure: 
    - Prepare phase (set time in seconds to use as a countdown before they start with the workout) (seconds)
    - Work - Do exercise for this long (seconds)
    - Rest - Rest for this long (seconds)
    - Rounds - One round is Work + Rest (number)
    - Cycles - One cycle is X Rounds (number)
    - Rest Between Cycles - recovery interval (seconds)

This should be done as widget in the Tools page, following the layout of the other two widgets there
We don't need to store any data (settings can be done locally (localStorage so they will be available if tab is closed and reopened ))
There are screenshots attached so we should follow that design. 

