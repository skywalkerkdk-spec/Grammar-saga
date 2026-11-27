"""Cross-file invariants for the Chapter II authored catalogue."""
import json
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1] / 'story'
data = {path.stem: json.loads(path.read_text()) for path in root.glob('*.json')}
episodes = data['STORY_DATA']['episodes']
town_ids = {town['id'] for town in episodes}
assert len(town_ids) == 18
assert sum(len(town['residents']) for town in episodes) == 72
network = data['TOWN_NETWORK']['towns']
residents = {npc['id']: town['town_id'] for town in network for npc in town['new_residents']}
assert len(residents) == 180
intrigue = data['DEMON_ARMY_INTRIGUE']['events']
assert len({event['agent']['id'] for event in intrigue}) == 18
for event in intrigue:
    residents[event['agent']['id']] = event['town_id']
daily = data['RESIDENT_DAILY_DIALOGUE']
assert len({entry['npc_id'] for entry in daily['residents']}) == 180
assert all(residents[entry['npc_id']] == entry['town'] and entry['personal_dialogue'] for entry in daily['residents'])
assert len(daily['role_pools']) == 10
assert all(len(lines) == 6 for lines in daily['role_pools'].values())

def normalize(text):
    return ' '.join(text.split())

personal_lines=[line for resident in daily['residents'] for line in resident['personal_dialogue']]
assert len(personal_lines)==180
for line in personal_lines:
    chunks=line['direct_chunks']
    assert len(chunks)>1 and all(chunk['ko'] for chunk in chunks)
    assert normalize(' '.join(chunk['en'] for chunk in chunks))==normalize(line['en'])

volumes = {}
series = sum((data[name]['books'] for name in (
    'LIBRARY_SERIAL_BOOKS', 'LIBRARY_SERIAL_EXPANSION_A', 'LIBRARY_SERIAL_EXPANSION_B')), [])
assert len({book['id'] for book in series}) == 11
for book in series:
    previous = None
    for index, volume in enumerate(book['volumes'], 1):
        assert volume['id'] not in volumes
        assert volume['number'] == index
        assert volume['previous_volume'] in (previous, None)
        assert volume['unlock'].get('town_recovered') in town_ids | {None}
        assert 0 <= volume['unlock'].get('registered_pages', 0) <= 18
        for language in ['en', 'ko']:
            assert normalize(volume[language]) == normalize(' '.join(
                segment[language] for segment in volume['segments']))
        assert len(volume['segments']) >= 3
        previous = volume['id']
        volumes[previous] = volume
assert len(volumes) == 89

def evidence_text(text):
    return re.sub(r'[^\w ]', '', normalize(text.casefold()))

book_quests = data['BOOK_SECRETS_AND_MERCHANTS']['quests']
for quest in book_quests:
    source = volumes[quest['volume_id']]
    assert quest['town'] in town_ids
    assert evidence_text(quest['clue']['en']) in evidence_text(source['en'])
    assert evidence_text(quest['clue']['ko']) in evidence_text(source['ko'])

resolution = data['DEMON_ARMY_RESOLUTIONS']['cases']
assert {case['parent'] for case in resolution} == {event['id'] for event in intrigue}
verified = {case['steps'][-1]['grant_flag'] for case in resolution}
assert len(verified) == 18
hideouts = data['CHAPTER2_FINAL_EXPANSION']['lairs']
assert {lair['id'] for lair in hideouts} == {row['lair'] for row in data['COMPANION_AND_OFFICER_DEPTH']['officers']}
assert verified == {flag for lair in hideouts for flag in lair['unlock']['all_verified']}
book_flags = {quest['id']+'_complete' for quest in book_quests}
for room in data['CHAPTER2_CLOSURE_AND_EXPLORATION']['vaults']:
    assert room['requires'] in book_flags and room['town'] in town_ids
for episode in data['REGIONAL_STORIES_REVISED']['cases']:
    assert len(episode['steps']) == 7
    assert set(episode['required_towns']) <= town_ids
    seen = set()
    for stage in episode['steps']:
        assert stage['npc'] in residents
        assert set(stage['requires']) <= seen
        seen.add(stage['id'])
assert len({row['character'] for row in data['COMPANION_AND_OFFICER_DEPTH']['arcs']}) == 8

questions = 0
def check_structures(entry):
    global questions
    if isinstance(entry, list):
        for item in entry:
            check_structures(item)
    if isinstance(entry, dict):
        if 'options' in entry and 'correct_index' in entry:
            options = entry['options']
            assert 0 <= entry['correct_index'] < len(options), entry
            assert len({normalize(option).casefold() for option in options}) == len(options), entry
            questions += 1
        if isinstance(entry.get('npc'), str):
            assert entry['npc'] in residents, entry
        if isinstance(entry.get('npc_id'), str):
            assert entry['npc_id'] in residents, entry
        for section in entry.values():
            check_structures(section)

for name in ['TOWN_EVENTS', 'TOWN_UNIQUE_EVENTS', 'TOWN_RELATIONSHIP_STORIES', 'REGIONAL_STORIES_REVISED',
             'DEMON_ARMY_INTRIGUE', 'DEMON_ARMY_RESOLUTIONS', 'BOOK_SECRETS_AND_MERCHANTS',
             'CHAPTER2_CLOSURE_AND_EXPLORATION', 'CHAPTER2_FINAL_EXPANSION', 'COMPANION_AND_OFFICER_DEPTH',
             'SPECIAL_QUESTS', 'LIBRARY_DATA']:
    check_structures(data[name])
print(f'Validated 89 volumes, 6 book clues, {len(residents)} additional resident IDs, '
      f'18 verified cases, 5 lairs and {questions} authored tasks')
