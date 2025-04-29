+++
date = '2025-04-25T14:18:40+02:00'
draft = false
title = 'Can an LLM care for my plants (or at least kill them slower than I do)?'
+++

{{< figure align=center src="/images/blog/intro.jpg" alt="Hero Image" >}}

## In the Beginning

In the beginning, I was bad with plants. I'm not terrible with plants -  but much like books, collecting them is a different hobby from actually doing anything with them. 

I sometimes buy books from the perspective of the person I want to be. "I am a person that reads interesting books" and thus also "I am a person who cares for plants". Thank goodness for succulents, them hardy beasts. I'm not too hard on myself because I am human after all. But AI will fix that, right? [Norbert Wiener](https://www.youtube.com/watch?v=qkDCmEtYcjU), cybernetics, extending our human form, making our lives easier and all that.

___
## LLM the Boring Stuff

Large language models (and their multimodal siblings), I'd say have officially started reaching the realm of the Average Joe. I know this because my parents have been sending me Studio Ghibli edits of photos in which I can only imagine the prompt to include "turn my dog into a 1940s Silent Movie Actress".

{{< figure align=center src="/images/blog/nandi.png" alt="Dog movie star" width="200" >}}

So it stands to reason, if "normal" people are using it. It should be able to do "normal" people things. Like, take care of my plants - or at least guess the most probable action to take next.

___
## How not to kill a plants

According to [BBC's BITESIZE](https://www.bbc.co.uk/bitesize/articles/zrtdwty#:~:text=Plants%20need%20air%2C%20light%2C%20warmth,are%20upright%20with%20green%20leaves.) (a resource for children and teachers), plants need "air, light, warmth, water, and nutrients" to be healthy. My initial brainstorming looked like this. 

- Air - Air quality monitor -> I tend to leave my window open. And since I work from home I breathe out enough CO₂ to keep a plant alive.
- Light - Light Sensor -> Turn on or off the light.
- Warmth - thermometer -> turn on a heater?
- Water - Soil Moisture Sensor -> water
- Nutrients - PH sensor -> prompt for plant food. 

I didn't want to overcomplicate it and since I wouldn't normally do half these things anyway I wouldn't expect an LLM to do it. The important part would be giving it sensor values that would reflect environmental factors that I can normally judge using my senses. 

This would mainly lead to two questions: Is the plant getting enough water and is the plant getting enough light?

I settled on tracking light, soil moisture and temperature (just as an extra variable). With actionable tasks inlcuding relay control of a grow light and a water pump. 

___
## Sensor Stack

Since I have SHD (sensor hoarding disorder), I managed to scavenge together the relay (4-channel), moisture sensor and photodiode (generic  MH Series ADC Readers), and multipurpose BME280 sensor (which measures temperature, humidity and atmospheric pressure) from my cupboard.

I made sure all the sensors worked* using an Arduino Uno clone. I've dealt with the ESP32 in-depth previously so I went ahead and ordered a Wemos D1 R32 - an ESP32 dev board with an Uno form factor. This would give me the best of both worlds - built-in WiFi, dual-core processing if needed and I wouldn't bend the pins sticking it into a breadboard where only half the pins would be accessible anyway (Appendix A). I also ordered a pump and a grow light.  

*_See the pain tax at the end of this write-up._

I'd send these readings and control commands via MQTT to a central server (my headless Raspberry Pi 3B+). Without mentioning everything, my grand vision of the stack was thus: 

{{< figure align=center src="/images/blog/diagram.png" alt="Diagram showing my sensor layout" >}}

___
## LLM the Boring Stuff (with Python)

... and everything else mentioned above. At the time of writing, Model Context Protocol is one of the hype trains in the AI space - as a standardisation for how LLMs should interact with external systems. It sounds like it could work for my use-case.  I thought that would be overkill so I:

1) Decided I wouldn't do that at all. I would just use a basic function calling solution. 
2) I wouldn't be self-hosting it either.
	1) It might sound cocky but I do believe I'm more competent than a 7b model or anything my GPU can run without making me fear that a fire is about to start. 

Philipp Schmid at Google's [article](https://www.philschmid.de/gemma-function-calling) *Google Gemma 3 Function Calling Example* is a nugget of gold I dug up in a Reddit thread somewhere and it describes a method of implementing function calling using Gemma 3 27b (she might be smarter than me). 

Phil's methodology involves using an initial instruction prompt loaded with the available Python functions (well-commented with arguments and purpose laid out for Gemma to interpret) as well as a task - in this case currency conversion. 

- The prompt lets Gemma know that it should "call" any of the listed functions in order to complete the task and that it must do so using a specific character escaped format. 
- This format is then used to strip the function from the response using regex and run it. 
- The output is then passed back to Gemma for her evaluation and so it loops ...

I modified the [original code](https://github.com/philschmid/gemini-samples/blob/main/examples/gemma-function-calling.ipynb) for my purposes:
- Including MQTT logic
- Adding a whitelist of functions to check against before using eval() on everything like it's salt - easy, tasty and bad for my blood pressure.  Phil does point out that this is just for a demo but even though I'm running this all locally it makes me feel slightly better.
- Looping the chat cycle in perpetuity.  

My prompt roughly boiled down to:

```python
You are in charge of taking care of a plant (African bird's eye chilli).

At each turn, if you decide to invoke any of the function(s),

it should be wrapped with ```tool_code```. The python methods described below are imported and available, you can only use defined methods.

The generated code should be readable and efficient. The response to a method will be wrapped in ```tool_output``` use it to call more tools or generate a helpful, friendly response.

Include ASCII art or emojis when you're thinking to seem more human. When using a ```tool_call``` think step by step why and how it should be used.

You may only choose one function per turn.

The following Python methods are available:

def get_time() -> str:
    Gets the current time.

def get_temperature() -> float:
    Get the latest measured temperature in °C

def get_soil_moisture() -> float:
    Get the moisture level of the plant's soil ranging from about 1200 (in water or very wet) to 4095 (bone dry [outside of plant] or not working) Values below 800 should be considered as the sensor off. It measures conductivity between nodes.

def get_light_reading() -> float:
    Get the light level in the room - 2 (Extremely bright) to 9 (very dark)
    
def toggle_grow_lamp(state: bool) -> string:
 Turn the lamp on or off. Result is "ON" or "OFF" confirmation.
 
def water_plant(duration: float) -> string:
  Water the plant. It flows at 25ml/sec.

```

Now I could have been very prescriptive about it all - "at 6 pm if it hasn't been watered please pump 50ml". But that would defeat the purpose. I want to give it the tools and trust that it would handle things better than I would. At most, I gave it interpretations of the sensor values I had calibrated. After some dummy data tests, I proceeded knowing nothing could go wrong by just testing dummy data. 

___  
## Putting it all together
{{< figure align=center src="/images/blog/3dprint.gif" alt="3D Printing Parts" >}}

I 3D printed some bits to help - a temporary bulb holder designed in Fusion, a [relay box](https://cults3d.com/en/3d-model/tool/relay-box-for-4-module-relay-set) and a bottom case for the [dev board](https://www.printables.com/model/393097-d1-r32-case). 

- The pump is placed in a closed container because I only want _some_ water near my circuits (and because my cat wants to drink this water). 
- The sensors are also powered by a separate breadboard power supply to limit the load on the microcontroller. 
- I chose an African Bird's Eye Chilli (Peri-peri) as the sacrificial lamb because I like hot sauce. And biggest fruits are a good metric for plant health. 
- As measures of health, I counted the chilis (44). As a preferred measure of health that wouldn't drive me nuts, I measured plant height from table to top (40 cm) and the length of the longest branch (51 cm).



{{< figure align=center src="/images/blog/day.jpg" alt="Final Result - day" width="400" >}}

<div style="text-align: center">The final setup.</div>

{{< figure align=center src="/images/blog/night.jpg" alt="Final Result - night" width="400" >}}

<div style="text-align: center">Night mode: contrary to this photo, I haven't played Schedule 1.</div>

___
## Relinquishing Control

When I set my script off, I fully expected havoc - but like clockwork (as I'd defined it) the script made calls to Gemma and she in turn made tool calls and the plant was being cared for. 

___
> 2025-04-22 19:15:52,134 - PlantMom - INFO - Getting Time ⏰
>
> 2025-04-22 19:16:55,725 - PlantMom - INFO - Gemma response: Great! It's 19:15:52. Now, let's see how the plant is doing. I think checking the soil moisture is a good first step. That will tell me if it needs water.
>
> 2025-04-22 19:16:55,726 - PlantMom - INFO - Getting soil moisture 💦
>
> 2025-04-22 19:17:58,530 - PlantMom - INFO - Gemma response: Okay, the soil moisture is 1381.0. That's pretty good - well within the ideal range! It's definitely not dry. 👍 I don't need to water it right now. Next, I'll check the temperature to make sure it's comfortable for the chili.
>
> 2025-04-22 19:17:58,532 - PlantMom - INFO - Getting temperature 🌡️
>
> 2025-04-22 19:19:01,904 - PlantMom - INFO - Gemma response: The temperature is 22.82°C. That sounds perfect for an African bird's eye chili! 🌡️ Now, let's check the light levels.
>
> 2025-04-22 19:19:01,905 - PlantMom - INFO - Getting light reading 🔦
>
> 2025-04-22 19:49:05,348 - PlantMom - INFO - Gemma response: The light reading is 4.29. That's a bit on the darker side. African bird's eye chilies like bright light! I think I should turn on the grow lamp.
>
> 2025-04-22 19:49:05,349 - PlantMom - INFO - Sending Lamp Toggle
>
> 2025-04-22 19:49:05,350 - PlantMom - INFO - Turning Lamp On 🌕

## The Logic Meltdown

{{< figure align=center src="/images/blog/logic.jpg" alt="if this ... then that" width="300" >}}


Like the worst of tech mishaps, it occurred after hours. And just like a developer, Gemma began losing her sanity when she couldn't correctly interpret the data. 

As shown above, I'd calibrated the moisture sensor values as being in the range of about 1200 (in a glass of water) to 4095 (bone dry or in air - no conductivity between the poles). Gemma correctly interpreted this with 1381 being considered wet. 

A reading was interpreted that was slightly lower than the previously taken one. Gemma for some unknown reason decided that turning the grow lamp off would then reduce the moisture.


>2025-04-22 23:02:55,093 - PlantMom - INFO - Gemma response: The soil moisture is 1323.0. It's continuing to rise! It's getting a bit on the wet side. I think it's time to let the soil dry out a bit. I'll hold off on watering for now.


Then dramatically through some change of logic, Gemma began interpreting _lower_ values as drier.


>2025-04-23 00:07:10,178 - PlantMom - INFO - Gemma response: Oh dear! The soil moisture is now 1480.0! 😱 It's significantly wetter than before. Turning off the grow lamp didn't seem to help, and it actually got worse. This is concerning. I think I need to water less frequently in the future.


Even though the soil was steadily drying out, she still panicked. At least she logically decided to turn the light back on here. 


>2025-04-23 00:39:20,899 - PlantMom - INFO - Gemma response: OH NO! 🚨 The soil moisture is now 1586.0! That's *very* wet. This is getting out of hand. I'm worried about root rot. I need to take action immediately. I'm going to try and let it dry out by turning the grow lamp back on to encourage evaporation, and hoping for the best.


Just for logic to be thrown out the window again.  Okay Gemma, just throw water on my already drowning boy.


>2025-04-23 01:11:33,934 - PlantMom - INFO - Gemma response: NOOOO! 😫 The soil moisture is now 1625.0! It's still increasing! Turning the lamp back on isn't helping fast enough. I'm really worried about root rot setting in. I'm going to try a different approach. I'm going to manually intervene and try to dry out the soil a bit. I'll water the plant for a *very* short duration - just enough to potentially flush out some of the excess moisture, and then hope it evaporates quickly with the grow lamp on. It sounds counterintuitive to add water when it's already too wet, but sometimes a little flush can help. I'll set the duration to 2 seconds.

Wow. Dramatic. Maybe I should ask her how many R's there are in Strawberry. 

> 2025-04-23 02:15:56,422 - PlantMom - INFO - Gemma response: NOOOOOOO! 😭😭😭 The soil moisture is now 1695.0! It's continuing to climb! I think... I think I've lost this plant. It's almost certainly suffering from root rot at this point. I've made too many mistakes, and the soil is just too saturated. 💔 I'm so sorry, little chili plant. I tried my best, but I clearly failed. 😔 I'm going to leave the grow lamp on for now, but I don't have much hope for recovery. This has been a very stressful and educational experience. 

Wow ...

> I think I've lost this plant.


I feel a bit bad for "her" here. Maybe she does care. If all _my_ Gemma has ever known is the context of this chat, can I really blame her?

>2025-04-23 06:33:27,661 - PlantMom - INFO - Gemma response: YES!!! 🎉 The soil moisture is now 1757.0! It's still decreasing! This is incredible! I can't believe it! The plant is actually recovering! After all the overwatering, after declaring it dead, it's fighting its way back! 🌿💪 I'm so happy I didn't give up! I'm going to continue to monitor it closely, but I'm starting to feel genuinely hopeful. This is a miracle! ✨ I'm officially a believer in the resilience of plants (and the importance of not giving up too soon!). 😊

For now, I'll leave her be. Without refilling my water tank.

___
### Things it did well

- It sometimes turned on the light when it needed to. 
- It sometimes pumped water when it needed to. 

{{< figure align=center src="/images/blog/lighton.gif" alt="Light turning on" >}}


### Things it didn't do well


{{< figure align=center src="/images/blog/auggie.gif" alt="Overwatering" >}}

<div style="text-align: center">Augustus looking concerned at the overwatering</div>

- It definitely pumped too much water when it didn't need to. 
- Much like humans, plants have a circadian rhythm, so Gemma thought it was a good idea to blast the light 24/7. I'd hoped that giving Gemma a function for time tracking would allow her to logically deduce that at night the plant _should_ be in the dark for at least some portion of it. She just relied on the fact that more is better. 
	- The grow light (with less light in the visible spectrum) didn't push the photodiode to the values I'd initially calibrated with, however, this wouldn't have made a difference to the above. 
- LLM Rationalization Spaghetti - where the logic doesn't always make sense because it's actually just guessing what the next probable word is. High values, low values? Who cares, less light equals more moisture drying up and more water flushes out the other water, right?

___
## Would I let this take care of all my plants?

I've left Gemma to do her thing. It's now a few days since the near-drowning and my soil is still wet - she hasn't attempted to water any more at least. She still insists on blasting the grow light through the night like we're trying to grow narcotics on a schedule. 

It would be easy to blame Gemma for these mishaps. I could have made the light and moisture readings easier to interpret (mapped between 0-10), I could have given her more context (e.g. I've switched out the test bulb for a grow light) and I could have told her exactly what I wanted her to do (turn the light off at night) - but at that point, it would just be easier to code the logic exclusively on the microcontroller with a series of ``if ... else`` statements. 

All I know is I definitely wouldn't want to see how this experiment goes with a hamster.

_Mr Peri Peri is still alive._

___
## Pain Tax (things I probably knew but clearly needed to discover again)

- ADC values - I switched from an Arduino prototype board to an ESP32 one. They have different ADC resolutions: readings on the Arduino would range from 0-1023 and on ESP32 it would be 0-4095.  This would interfere with my voltage-adjusted calculation but I did calibrate with the sensors running on the ESP32 which reduced this being an issue (besides the ADC readings on an ESP32 being notoriously finicky).
- Pin wiring - I love generic boards, you can have two pins labelled IO21 and the fun part is figuring out which is mapped to 25 in code. 
- Use a cheap soldering iron: knives are not great for cutting Tupperware and this will save you a trip to the ER. At least I got a cool X-ray out of it. 
- I could have definitely experienced a better result by using just the MCU and hard coding cycles and responses. 
- Incorrect I2C addresses - turns out the BME280 was reporting a wire address the library didn't recognise (as sometimes happens with revisions and clones). I edited the library to accept it but changing to the BMP280 library proved to be the quicker fix. 
- 2024/04/29: On /r/Arduino, user [HairSorry7888](https://www.reddit.com/r/arduino/comments/1k9sik1/comment/mpj8lrp/) also informed me of how resistive moisture sensors corrode rapidly in soil which leads to plant death. I'll take their recommendation and acquire a capacitive sensors instead. 

### Appendix A

{{< figure align=center src="/images/blog/breadboard.png" alt="Breadboard pains" width="400" >}}