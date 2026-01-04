# Feed Logic Spec

## Card Selection
- The feed of cards should be unending for the user, it should never be possible not to be able to swipe to the next card.
- First choose the type of card to show from the available card types based on the user's settings.
- Each type of card should be shown in equal frequency. If there are 6 card types, each type should be shown 1/6 of the time.
- Then randomly choose a card from the available cards of that type.
- For a given session, track which cards have been seen. Don't show cards that have been seen in the current session.
- If there are no cards of a given type left to see, return all cards of that type to the available cards pool and choose again. It's ok to show cards multiple times in a session if all cards of that type have been seen.

## Card Settings
- On the settings page the user can choose what type of cards they want to see.
- Whenever user settings change, the queue should be updated to reflect the new settings.
- If cards in the queue have a type that the user has taken out, remove them from the queue and start preparing new cards to refill the ready queue.
- If a card type was previously disabled then turned back on, throw the whole queue away and start over so that the balance of card types remains equal.

## Card Queues
- Always prepare the next 5 cards to be see. This means getting any data from APIs or making DB queries, and using the layout engine to determine the layout of the card and if any elements need to be truncated.
- Card preparation should be non-blocking and should not block the main thread or UI. It should be done in the background.
- Keep a queue of cards in preparation and a queue of cards ready to show. When a card's prepation is finished move it from the in preparation queue to the ready to show queue.
- The order of the cards in the preparation queue and their order in the ready to show queue do not need to be the same. Move cards to the ready to show queue as soon as they are ready.
- Every time a card is displayed should trigger the preparation of a new card to add to the queue.

## Handling Errors
- If an error occurs while preparing a card, just skip it, put it in the seen list, and move on to the next random card.
- Never retry API calls on error, just skip the card, and move on.

## Fast Scrolling
- If the user swipes so fast that the ready queue is empty, show a loading message on a blank card and update it with the next card that enters the ready queue as soon as it is ready.
