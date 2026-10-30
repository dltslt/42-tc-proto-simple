# proper-03: content relations, embeddings, and their scope

**Kind:** proper
**Seed:** 100 items
**Question:** can Lerch suggest related items from their content without linking every item to every other one, and how is that kept in scope?

## Team notes

From the team's notes of 29 October, quoted as written:

> hierarchical are more or less clear - come from creating items within items.
>
> content wise is the more interesting. are "embeddings" the answer? like hindsight is doing it to make the connections? that would kina link every item to every other one, wouldn't it? doesn't this increase workload over time? how could that be scope limited? should it be scope limited? perhaps the other model for "rankings" is an answer to that.
>
> it must be made clear if this shall truly only refer to LLM or also other models like ranking/embedding models.
>
> llm assistance could be:
>
> - suggest description for an item, after the title was written
> - base thas description on other notes that already exist
> - utilize the 'embedded' relations to get there
> - offer dor and dod from it's own or related content

## Findings from earlier runs

(Filled in by hand before this run starts. If empty, ignore.)

## Scenario

A member types a new task title. Before they press Enter, Lerch shows a few existing items that look related, from the same space. They accept one as a link, or ignore them. On an existing item, a "related" panel shows the same kind of suggestions, with a reason.

## Build

- Two ways to find related items, behind one interface, so they can be compared:
  1. a plain text baseline (TF-IDF or BM25 over title, description, and tags), no model
  2. embeddings from a local model (for example a small sentence model run in Node; name it). Vectors are stored next to the items and refreshed when the text changes.
- Scope rules as settings: same project only, or the whole space. A limit on how many suggestions appear, and a minimum score.
- Suggestions are never stored as links until a person accepts one. An accepted suggestion becomes an ordinary correlation link.
- A small fixture of related items on top of the seed: a few groups of tasks that are about the same thing in different words. Keep the list of intended pairs and measure how many each method finds.
- Measure the cost per item: time to embed one item, time per suggestion, storage per vector. Extrapolate to 10,000 items in NOTES.md.

## Done when

- Both methods return suggestions while typing a title, in under a few hundred milliseconds.
- NOTES.md compares the two on the intended pairs (found, missed, wrong), and on cost.
- NOTES.md says which scope rule kept the suggestions useful.

## Out of scope

Generating descriptions or definitions of ready with an LLM (LATER). Ranking models beyond the score cut-off.

## Touches

Which content connections belong (OPEN): similar text, same subject, embedding, ranking. Whether "LLM assistance" also covers embedding and ranking models (raised in the notes).
