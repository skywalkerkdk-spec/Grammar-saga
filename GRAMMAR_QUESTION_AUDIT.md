# Grammar Saga 영어 문제 검수 보고서

검수 상태는 **구조 전수 검사 완료, 의미 검수 진행 중**이다. 고정 문제은행에는 유형별 의미 규칙을 적용하고 확인된 오류를 수정했다. 고정 문장마다 여덟 기준을 모두 사람처럼 판정했다는 의미는 아니다.

## 검사 범위와 결과

| 출제원 | 수량 | 검사 범위 |
|---|---:|---|
| 문장 형식·준동사 문제은행 | 3,414 | 문장 조각, 번역 필드, 정답 인덱스, 중복 보기, 빈칸 완성 문장 비교 |
| 그래머 대륙·속담·숙어 고정 빈칸 | 11,584 | 전 행의 정답 인덱스, 보기 중복, 빈칸 수와 완성, 번역 필드. 비동사·시제·수동태·현재완료·관사·전치사·간접화법 문제의 확인된 의미 오류 수정 |
| 뉴스 문장 | 990 | 세 난이도의 문장 조각과 번역 필드 |
| NPC 교정 | 72 | 원래 오류 표시·정답·번역·중복 보기, 문맥과 보기 검토 |
| 특별 퀘스트 | 36 | 이중 언어 문구, 정답 인덱스, 중복 선택지 |
| 연결어와 셀프 던전 기본 제공 문항 | 69 | 복수 정답 목록과 오답의 분리, 보기 유효성 |
| 팁과 용어 | 337개 팁 기준 문구, 36개 용어 그룹 레코드 | 출제 경로와 원본 수량 확인 |

Chromium에서 시드를 고정해 세 난이도로 학습·RPG 던전, 일반·보스 출제, 대전과 오늘의 뉴스에서 총 **11,077개**의 문제를 생성했다. 원본 데이터와 생성 결과를 합쳐 **75,085건**의 구조 검사에서 실패가 없었다. 다운로드형 사용자 문항, 외부 등록 학습 자료, 기존 저장에 들어 있는 문제 사본은 이 검수에 포함되지 않았다.

## 자동 출제 변경

- 문장 조각을 빈칸 오답으로 사용할 때 같은 문장 골격에 들어갔던 조각만 후보로 삼는다. 필요한 수만큼 확보할 수 없으면 기존 문항을 사용한다.
- 문장 순서 맞추기는 자유롭게 옮길 수 있는 수식어를 포함한 문장을 건너뛴다. 영어 원문에서 수식어만 떼고 한국어 힌트에는 남겨 두던 경우가 사라진다.
- 자동 오류 탐지의 목적어 삽입은 이미 완성된 자동사 문장에 한정한다. 임의의 목적어 대신 해당 동사와 실제로 쓰는 장소 표현에서 전치사를 뺀 의도적 오류를 사용한다.
- 고쳐 쓰기 문제는 조동사 뒤 동사원형처럼 문법 위반이 확인되는 형태에서만 생성한다. 직접 쓰기에서 보기로 제시한 오답을 오타 허용으로 정답 처리하지 않는다.
- 무관사 표시 **×**는 완성 문장에 출력하지 않는다. 여러 빈칸의 답은 빈칸 순서대로 나누어 넣는다. 두 형식은 선택형으로 유지한다.

실제 브라우저 화면에서는 시제 마을 NPC 교정 문제의 표시와 정답 처리를 확인했다. Chapter II 최종 전투 18개 문제와 엔딩, 패시브 레이크 특별 퀘스트의 단서·재시도·보상 유지도 회귀 테스트에서 통과했다.

## 재현

`GRAMMAR_CHROMIUM=/usr/bin/chromium python tests/check_grammar_questions.py`

Python Playwright와 Chromium이 필요하다. Playwright가 관리하는 Chromium을 사용할 때는 환경 변수를 생략한다.

## 수정 전후 기록

총 289개 기록. NPC와 번역 수정 중에는 한 문항의 여러 표현을 개별 행으로 기재한 경우가 있다.

| 출제원 | 수정 전 | 수정 후 | 이유 |
|---|---|---|---|
| POOL | He described the castle to us. / 그는 탑의 모습을 우리에게 설명했다. | He described the castle to us. / 그는 성의 모습을 우리에게 설명했다. | castle을 탑으로 옮긴 번역을 성으로 수정 |
| POOL | The cave was left clean. / 동굴은 깨끗하게 남겨졌다. | The cave was left clean. / 사람들이 떠난 뒤에도 동굴은 깨끗했다. | 수동태 결과 상태를 자연스러운 한국어로 표현 |
| TOWN | sunny last night | sunny yesterday afternoon | 밤과 sunny의 시간 조건을 실제 햇빛이 있는 시간대로 조정 |
| TOWN | 어젯밤엔 맑았어요 | 어제 오후엔 맑았어요 | 변경된 시간대를 번역에 반영 |
| TOWN | the [[most smart]] in class | the [[smartlyest]] in class | 일부 맥락에서 가능한 분석적 최상급을 명백한 오류로 교체 |
| TOWN | the most smart in class | the smartlyest in class | 비교급·최상급 오류라는 출제 의도 유지 |
| TOWN | good [[in]] math | good [[to]] math | 과목 성적 맥락에서 가능한 in math를 명백한 전치사 오답으로 교체 |
| TOWN | good in math | good to math | 정답이 될 수 있는 전치사 조합 제거 |
| TOWN | [[Be not]] late | [[Don’t to be]] late | 문어체에서는 가능한 명령형을 문법상 불가능한 조동사 조합으로 교체 |
| TOWN | Be not late | Don’t to be late | 의도한 명령형 오류를 유지하면서 복수 정답 가능성을 제거 |
| SD_SAMPLES | If it rains tomorrow, we ____ at home. / 보기 stay, stayed, would stay, have stayed | If it rains tomorrow, we ____ at home. / 보기 will stayed, stayed, would stay, have stayed | 일정이나 규칙을 나타낼 때 가능한 현재형 stay를 문법상 틀린 보기로 교체 |
| SD_SAMPLES | He is the ____ student in our class. / 보기 taller, tall, more tall, most tall | He is the ____ student in our class. / 보기 taller, tall, more tall, most tallest | 문맥에 따라 가능한 분석적 최상급을 중복 최상급 오답으로 교체 |
| g1 | You ____ happy. / 보기 were, are, is / 너는 행복했다. | You ____ happy yesterday. / 보기 were, are, is / 어제 너는 행복했다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | The soup ____ cold. / 보기 was, is, were / 그 수프는 차가웠다. | The soup ____ cold yesterday. / 보기 was, is, were / 어제 그 수프는 차가웠다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | ____ our teacher a farmer? / 보기 Was, Is, Are / 우리 선생님은 농부였니? | ____ our teacher a farmer yesterday? / 보기 Was, Is, Are / 어제 우리 선생님은 농부였니? | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | Our teacher ____ at the gym. / 보기 wasn't, isn't, aren't / 우리 선생님은 체육관에 있지 않았다. | Our teacher ____ at the gym yesterday. / 보기 wasn't, isn't, aren't / 어제 우리 선생님은 체육관에 있지 않았다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | ____ her cousins careful? / 보기 Were, Was, Are / 그녀의 사촌들은 조심스러웠니? | ____ her cousins careful yesterday? / 보기 Were, Was, Are / 어제 그녀의 사촌들은 조심스러웠니? | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | The soup ____ clean. / 보기 was, are, is / 그 수프는 깨끗했다. | The soup ____ hot yesterday. / 보기 was, are, is / 어제 그 수프는 뜨거웠다. | 수프의 상태를 자연스러운 온도 표현으로 수정; 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | The girls ____ smart. / 보기 weren't, aren't, wasn't / 그 소녀들은 똑똑하지 않았다. | The girls ____ smart yesterday. / 보기 weren't, aren't, wasn't / 어제 그 소녀들은 똑똑하지 않았다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | My parents ____ thirsty. / 보기 weren't, aren't, isn't / 부모님은 목마르지 않았다. | My parents ____ thirsty yesterday. / 보기 weren't, aren't, isn't / 어제 부모님은 목마르지 않았다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | Mina ____ busy. / 보기 wasn't, isn't, aren't / 미나는 바쁘지 않았다. | Mina ____ busy yesterday. / 보기 wasn't, isn't, aren't / 어제 미나는 바쁘지 않았다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | ____ the children farmers? / 보기 Were, Is, Are / 아이들은 농부였니? | ____ the children farmers yesterday? / 보기 Were, Is, Are / 어제 아이들은 농부였니? | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | ____ Mr. Park at school? / 보기 Was, Is, Are / 박 선생님은 학교에 있었니? | ____ Mr. Park at school yesterday? / 보기 Was, Is, Are / 어제 박 선생님은 학교에 있었니? | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | The students ____ at school. / 보기 were, was, are / 학생들은 학교에 있었다. | The students ____ at school yesterday. / 보기 were, was, are / 어제 학생들은 학교에 있었다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | Mina ____ in the kitchen. / 보기 wasn't, weren't, isn't / 미나는 부엌에 있지 않았다. | Mina ____ in the kitchen yesterday. / 보기 wasn't, weren't, isn't / 어제 미나는 부엌에 있지 않았다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | ____ my friends absent? / 보기 Were, Are, Is / 내 친구들은 결석했니? | ____ my friends absent yesterday? / 보기 Were, Are, Is / 어제 내 친구들은 결석했니? | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | ____ I a police officer? / 보기 Was, Are, Is / 나는 경찰관이었니? | ____ I a police officer yesterday? / 보기 Was, Are, Is / 어제 나는 경찰관이었니? | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | The windows ____ dirty. / 보기 weren't, isn't, aren't / 그 창문들은 더럽지 않았다. | The windows ____ dirty yesterday. / 보기 weren't, isn't, aren't / 어제 그 창문들은 더럽지 않았다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | ____ he at the gym? / 보기 Was, Is, Were / 그는 체육관에 있었니? | ____ he at the gym yesterday? / 보기 Was, Is, Were / 어제 그는 체육관에 있었니? | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | ____ the visitors happy? / 보기 Were, Are, Is / 방문객들은 행복했니? | ____ the visitors happy yesterday? / 보기 Were, Are, Is / 어제 방문객들은 행복했니? | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | ____ I late? / 보기 Was, Are, Is / 나는 늦었니? | ____ I late yesterday? / 보기 Was, Are, Is / 어제 나는 늦었니? | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | ____ my friends nervous? / 보기 Were, Are, Is / 내 친구들은 긴장했니? | ____ my friends nervous yesterday? / 보기 Were, Are, Is / 어제 내 친구들은 긴장했니? | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | My brother ____ a student. / 보기 was, are, is / 내 형은 학생이었다. | My brother ____ a student yesterday. / 보기 was, are, is / 어제 내 형은 학생이었다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | I ____ thirsty. / 보기 was, is, were / 나는 목말랐다. | I ____ thirsty yesterday. / 보기 was, is, were / 어제 나는 목말랐다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | The soup ____ new. / 보기 wasn't, weren't, isn't / 그 수프는 새것이지 않았다. | The soup ____ fresh yesterday. / 보기 wasn't, weren't, isn't / 어제 그 수프는 신선하지 않았다. | 음식에는 새 물건을 뜻하는 new 대신 신선함을 표현; 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | Our teacher ____ a doctor. / 보기 is, are, am / 우리 선생님은 의사이다. | Our teacher ____ a science teacher. / 보기 is, are, am / 우리 선생님은 과학 교사이다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | Mina ____ a farmer. / 보기 was, is, were / 미나는 농부였다. | Mina ____ a farmer yesterday. / 보기 was, is, were / 어제 미나는 농부였다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | ____ Mr. Park polite? / 보기 Was, Is, Were / 박 선생님은 예의 발랐니? | ____ Mr. Park polite yesterday? / 보기 Was, Is, Were / 어제 박 선생님은 예의 발랐니? | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | The nurse ____ careful. / 보기 was, were, is / 그 간호사는 조심스러웠다. | The nurse ____ careful yesterday. / 보기 was, were, is / 어제 그 간호사는 조심스러웠다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | ____ Mr. Park a singer? / 보기 Was, Is, Are / 박 선생님은 가수였니? | ____ Mr. Park a singer yesterday? / 보기 Was, Is, Are / 어제 박 선생님은 가수였니? | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | She ____ hungry. / 보기 was, are, is / 그녀는 배고팠다. | She ____ hungry yesterday. / 보기 was, are, is / 어제 그녀는 배고팠다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | The bags ____ ready. / 보기 were, are, is / 그 가방들은 준비되어 있었다. | The bags ____ ready yesterday. / 보기 were, are, is / 어제 그 가방들은 준비되어 있었다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | ____ her cousins in Daegu? / 보기 Were, Was, Are / 그녀의 사촌들은 대구에 있었니? | ____ her cousins in Daegu yesterday? / 보기 Were, Was, Are / 어제 그녀의 사촌들은 대구에 있었니? | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | ____ the boys hungry? / 보기 Were, Is, Are / 그 소년들은 배고팠니? | ____ the boys hungry yesterday? / 보기 Were, Is, Are / 어제 그 소년들은 배고팠니? | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | The boys ____ honest. / 보기 weren't, isn't, aren't / 그 소년들은 정직하지 않았다. | The boys ____ honest yesterday. / 보기 weren't, isn't, aren't / 어제 그 소년들은 정직하지 않았다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | The boys ____ excited. / 보기 were, are, was / 그 소년들은 신이 나 있었다. | The boys ____ excited yesterday. / 보기 were, are, was / 어제 그 소년들은 신이 나 있었다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | ____ my friends honest? / 보기 Were, Is, Are / 내 친구들은 정직했니? | ____ my friends honest yesterday? / 보기 Were, Is, Are / 어제 내 친구들은 정직했니? | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | ____ Mina thirsty? / 보기 Was, Is, Were / 미나는 목말랐니? | ____ Mina thirsty yesterday? / 보기 Was, Is, Were / 어제 미나는 목말랐니? | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | The children ____ in the kitchen. / 보기 were, are, was / 아이들은 부엌에 있었다. | The children ____ in the kitchen yesterday. / 보기 were, are, was / 어제 아이들은 부엌에 있었다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | The nurse ____ quiet. / 보기 was, are, is / 그 간호사는 조용했다. | The nurse ____ quiet yesterday. / 보기 was, are, is / 어제 그 간호사는 조용했다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | Mina ____ at the airport. / 보기 was, is, were / 미나는 공항에 있었다. | Mina ____ at the airport yesterday. / 보기 was, is, were / 어제 미나는 공항에 있었다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | The children ____ shy. / 보기 were, is, are / 아이들은 수줍음이 많았다. | The children ____ shy yesterday. / 보기 were, is, are / 어제 아이들은 수줍음이 많았다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | ____ they late? / 보기 Were, Are, Is / 그들은 늦었니? | ____ they late yesterday? / 보기 Were, Are, Is / 어제 그들은 늦었니? | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | ____ your coat expensive? / 보기 Was, Is, Are / 네 코트는 비쌌니? | ____ your coat expensive yesterday? / 보기 Was, Is, Are / 어제 네 코트는 비쌌니? | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | I ____ shy. / 보기 was, is, are / 나는 수줍음이 많았다. | I ____ shy yesterday. / 보기 was, is, are / 어제 나는 수줍음이 많았다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | ____ the players in the garden? / 보기 Were, Is, Are / 선수들은 정원에 있었니? | ____ the players in the garden yesterday? / 보기 Were, Is, Are / 어제 선수들은 정원에 있었니? | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | The children ____ artists. / 보기 were, was, is / 아이들은 화가였다. | The children ____ students. / 보기 were, was, is / 아이들은 학생였다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | Her cousins ____ students. / 보기 weren't, aren't, wasn't / 그녀의 사촌들은 학생이 아니었다. | Her cousins ____ students yesterday. / 보기 weren't, aren't, wasn't / 어제 그녀의 사촌들은 학생이 아니었다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | She ____ honest. / 보기 wasn't, aren't, isn't / 그녀는 정직하지 않았다. | She ____ honest yesterday. / 보기 wasn't, aren't, isn't / 어제 그녀는 정직하지 않았다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | The visitors ____ doctors. / 보기 were, are, was / 방문객들은 의사였다. | The visitors ____ doctors yesterday. / 보기 were, are, was / 어제 방문객들은 의사였다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | These apples ____ dirty. / 보기 were, are, was / 이 사과들은 더러웠다. | These apples ____ dirty yesterday. / 보기 were, are, was / 어제 이 사과들은 더러웠다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | Mr. Park ____ at the station. / 보기 was, is, are / 박 선생님은 역에 있었다. | Mr. Park ____ at the station yesterday. / 보기 was, is, are / 어제 박 선생님은 역에 있었다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | ____ the coffee safe? / 보기 Was, Are, Is / 그 커피는 안전했니? | ____ the coffee safe yesterday? / 보기 Was, Are, Is / 어제 그 커피는 안전했니? | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | Tom and Mary ____ at the airport. / 보기 weren't, wasn't, aren't / 톰과 메리는 공항에 있지 않았다. | Tom and Mary ____ at the airport yesterday. / 보기 weren't, wasn't, aren't / 어제 톰과 메리는 공항에 있지 않았다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | The visitors ____ excited. / 보기 weren't, wasn't, aren't / 방문객들은 신이 나 있지 않았다. | The visitors ____ excited yesterday. / 보기 weren't, wasn't, aren't / 어제 방문객들은 신이 나 있지 않았다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | The lake ____ free. / 보기 wasn't, aren't, isn't / 그 호수는 무료이지 않았다. | The lake ____ free yesterday. / 보기 wasn't, aren't, isn't / 어제 그 호수는 무료이지 않았다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | I ____ happy. / 보기 wasn't, aren't, isn't / 나는 행복하지 않았다. | I ____ happy yesterday. / 보기 wasn't, aren't, isn't / 어제 나는 행복하지 않았다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | I ____ a cook. / 보기 was, is, are / 나는 요리사였다. | I ____ a cook yesterday. / 보기 was, is, are / 어제 나는 요리사였다. | 현재형도 가능한 문장에 과거 시점 단서를 추가 |
| g1 | The players ____ doctors. / 보기 are, is, am / 선수들은 의사이다. | The players ____ athletes. / 보기 are, is, am / 선수들은 운동선수이다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | ____ the girl a student last week? / 보기 Was, Were, Is / 그 소녀는 지난주에 학생이었니? | ____ the girl at school last week? / 보기 Was, Were, Is / 그 소녀는 지난주에 학교에 있었니? | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | ____ the teacher a doctor last week? / 보기 Was, Were, Is / 선생님은 지난주에 의사였니? | ____ the teacher at the clinic last week? / 보기 Was, Were, Is / 선생님은 지난주에 진료소에 있었니? | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | Mina ____ a good singer last week. / 보기 was, were, is / 미나는 지난주에 노래를 잘 부르는 사람이었다. | Mina ____ at the school concert last week. / 보기 was, were, is / 미나는 지난주에 학교 음악회에 있었다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | Mr. Kim ____ a doctor last night. / 보기 was, were, is / 김 선생님은 어젯밤에 의사였다. | Mr. Kim ____ at the hospital last night. / 보기 was, were, is / 김 선생님은 어젯밤에 병원에 있었다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | ____ our class a doctor? / 보기 Is, Are, Am / 우리 반은 의사이니? | ____ our class in the classroom? / 보기 Is, Are, Am / 우리 반은 교실에 있니? | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | ____ my friends doctors yesterday? / 보기 Were, Was, Is / 내 친구들은 어제 의사였니? | ____ my friends at the clinic yesterday? / 보기 Were, Was, Is / 내 친구들은 어제 진료소에 있었니? | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | My uncle ____ a doctor yesterday. / 보기 was, were, is / 삼촌은 어제 의사였다. | My uncle ____ at the clinic yesterday. / 보기 was, were, is / 삼촌은 어제 진료소에 있었다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | ____ Tom a doctor last week? / 보기 Was, Were, Is / 톰은 지난주에 의사였니? | ____ Tom at the clinic last week? / 보기 Was, Were, Is / 톰은 지난주에 진료소에 있었니? | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | The students ____ a good singer. / 보기 are, am, is / 학생들은 노래를 잘 부르는 사람이다. | The students ____ good singers. / 보기 are, am, is / 학생들은 노래를 잘 부르는 사람이다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | ____ my uncle a doctor yesterday? / 보기 Was, Were, Is / 삼촌은 어제 의사였니? | ____ my uncle at the clinic yesterday? / 보기 Was, Were, Is / 삼촌은 어제 진료소에 있었니? | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | ____ the students doctors yesterday? / 보기 Were, Was, Is / 학생들은 어제 의사였니? | ____ the students in class yesterday? / 보기 Were, Was, Is / 학생들은 어제 수업 중였니? | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | The boys ____ a doctor last week. / 보기 were, was, is / 소년들은 지난주에 의사였다. | The boys ____ in class last week. / 보기 were, was, is / 소년들은 지난주에 수업 중였다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | We ____ a doctor last night. / 보기 were, was, is / 우리는 어젯밤에 의사였다. | We ____ at the hospital last night. / 보기 were, was, is / 우리는 어젯밤에 병원에 있었다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | The twins ____ a student last week. / 보기 were, was, is / 쌍둥이는 지난주에 학생이었다. | The twins ____ at school last week. / 보기 were, was, is / 쌍둥이는 지난주에 학교에 있었다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | ____ the children doctors? / 보기 Are, Is, Am / 아이들은 의사이니? | ____ the children students? / 보기 Are, Is, Am / 아이들은 학생이니? | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | ____ we a doctor? / 보기 Are, Is, Am / 우리는 의사이니? | ____ we doctors? / 보기 Are, Is, Am / 우리는 의사이니? | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | My sister ____ a doctor last night. / 보기 was, were, is / 내 여동생은 어젯밤에 의사였다. | My sister ____ at the hospital last night. / 보기 was, were, is / 내 여동생은 어젯밤에 병원에 있었다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | He ____ a good singer last week. / 보기 was, were, is / 그는 지난주에 노래를 잘 부르는 사람이었다. | He ____ at the school concert last week. / 보기 was, were, is / 그는 지난주에 학교 음악회에 있었다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | Jisu ____ a good singer last week. / 보기 was, were, is / 지수는 지난주에 노래를 잘 부르는 사람이었다. | Jisu ____ at the school concert last week. / 보기 was, were, is / 지수는 지난주에 학교 음악회에 있었다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | ____ Tom a good singer yesterday? / 보기 Was, Were, Is / 톰은 어제 노래를 잘 부르는 사람이었니? | ____ Tom at the school concert yesterday? / 보기 Was, Were, Is / 톰은 어제 학교 음악회에 있었니? | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | The twins ____ a doctor. / 보기 are, am, is / 쌍둥이는 의사이다. | The twins ____ doctors. / 보기 are, am, is / 쌍둥이는 의사이다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | We ____ a student. / 보기 are, am, is / 우리는 학생이다. | We ____ students. / 보기 are, am, is / 우리는 학생이다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | ____ the children doctors yesterday? / 보기 Were, Was, Is / 아이들은 어제 의사였니? | ____ the children in class yesterday? / 보기 Were, Was, Is / 아이들은 어제 수업 중였니? | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | ____ Jisu a good singer last week? / 보기 Was, Were, Is / 지수는 지난주에 노래를 잘 부르는 사람이었니? | ____ Jisu at the school concert last week? / 보기 Was, Were, Is / 지수는 지난주에 학교 음악회에 있었니? | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | Our class ____ a doctor last night. / 보기 was, were, is / 우리 반은 어젯밤에 의사였다. | Our class ____ on a field trip yesterday. / 보기 was, were, is / 우리 반은 어제 현장 학습 중이었다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | ____ they a good singer? / 보기 Are, Is, Am / 그들은 노래를 잘 부르는 사람이니? | ____ they good singers? / 보기 Are, Is, Am / 그들은 노래를 잘 부르는 사람이니? | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | Mr. Kim ____ a good singer last week. / 보기 was, were, is / 김 선생님은 지난주에 노래를 잘 부르는 사람이었다. | Mr. Kim ____ at the school concert last week. / 보기 was, were, is / 김 선생님은 지난주에 학교 음악회에 있었다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | My parents ____ a doctor. / 보기 are, am, is / 부모님은 의사이다. | My parents ____ doctors. / 보기 are, am, is / 부모님은 의사이다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | ____ Mina a student yesterday? / 보기 Was, Were, Is / 미나는 어제 학생이었니? | ____ Mina at school yesterday? / 보기 Was, Were, Is / 미나는 어제 학교에 있었니? | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | ____ the twins a student? / 보기 Are, Is, Am / 쌍둥이는 학생이니? | ____ the twins students? / 보기 Are, Is, Am / 쌍둥이는 학생이니? | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | ____ our class a student yesterday? / 보기 Was, Were, Is / 우리 반은 어제 학생이었니? | ____ our class on a field trip yesterday? / 보기 Was, Were, Is / 우리 반은 어제 현장 학습 중이었니? | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | The girl ____ a doctor. / 보기 is, am, are / 그 소녀는 의사이다. | The girl ____ a student. / 보기 is, am, are / 그 소녀는 학생이다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | ____ we a good singer yesterday? / 보기 Were, Was, Is / 우리는 어제 노래를 잘 부르는 사람이었니? | ____ we at the school concert yesterday? / 보기 Were, Was, Is / 우리는 어제 학교 음악회에 있었니? | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | The children ____ a good singer. / 보기 are, am, is / 아이들은 노래를 잘 부르는 사람이다. | The children ____ good singers. / 보기 are, am, is / 아이들은 노래를 잘 부르는 사람이다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | ____ I a good singer yesterday? / 보기 Was, Were, Is / 나는 어제 노래를 잘 부르는 사람이었니? | ____ I at the school concert yesterday? / 보기 Was, Were, Is / 나는 어제 학교 음악회에 있었니? | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | The boys ____ a student. / 보기 are, am, is / 소년들은 학생이다. | The boys ____ students. / 보기 are, am, is / 소년들은 학생이다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | ____ my brother a student yesterday? / 보기 Was, Were, Is / 내 남동생은 어제 학생이었니? | ____ my brother at school yesterday? / 보기 Was, Were, Is / 내 남동생은 어제 학교에 있었니? | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | The children ____ a student. / 보기 are, am, is / 아이들은 학생이다. | The children ____ students. / 보기 are, am, is / 아이들은 학생이다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | ____ Mr. Kim a student last night? / 보기 Was, Were, Is / 김 선생님은 어젯밤에 학생이었니? | ____ Mr. Kim at school last night? / 보기 Was, Were, Is / 김 선생님은 어젯밤에 학교에 있었니? | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | The children ____ a doctor. / 보기 are, am, is / 아이들은 의사이다. | The children ____ students. / 보기 are, am, is / 아이들은 학생이다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | ____ Mina a good singer last week? / 보기 Was, Were, Is / 미나는 지난주에 노래를 잘 부르는 사람이었니? | ____ Mina at the school concert last week? / 보기 Was, Were, Is / 미나는 지난주에 학교 음악회에 있었니? | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | My friends ____ a student. / 보기 are, am, is / 내 친구들은 학생이다. | My friends ____ students. / 보기 are, am, is / 내 친구들은 학생이다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | ____ the twins a student last week? / 보기 Were, Was, Is / 쌍둥이는 지난주에 학생이었니? | ____ the twins at school last week? / 보기 Were, Was, Is / 쌍둥이는 지난주에 학교에 있었니? | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | My friends ____ a good singer. / 보기 are, am, is / 내 친구들은 노래를 잘 부르는 사람이다. | My friends ____ good singers. / 보기 are, am, is / 내 친구들은 노래를 잘 부르는 사람이다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | ____ he a student yesterday? / 보기 Was, Were, Is / 그는 어제 학생이었니? | ____ he at school yesterday? / 보기 Was, Were, Is / 그는 어제 학교에 있었니? | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | The boys ____ a doctor. / 보기 are, am, is / 소년들은 의사이다. | The boys ____ students. / 보기 are, am, is / 소년들은 학생이다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | ____ I a doctor last week? / 보기 Was, Were, Is / 나는 지난주에 의사였니? | ____ I at the clinic last week? / 보기 Was, Were, Is / 나는 지난주에 진료소에 있었니? | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | The twins ____ a good singer yesterday. / 보기 were, was, is / 쌍둥이는 어제 노래를 잘 부르는 사람이었다. | The twins ____ at the school concert yesterday. / 보기 were, was, is / 쌍둥이는 어제 학교 음악회에 있었다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | My parents ____ a student. / 보기 are, am, is / 부모님은 학생이다. | My parents ____ students. / 보기 are, am, is / 부모님은 학생이다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | ____ my sister a doctor last night? / 보기 Was, Were, Is / 내 여동생은 어젯밤에 의사였니? | ____ my sister at the hospital last night? / 보기 Was, Were, Is / 내 여동생은 어젯밤에 병원에 있었니? | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | ____ Mr. Kim a doctor last night? / 보기 Was, Were, Is / 김 선생님은 어젯밤에 의사였니? | ____ Mr. Kim at the hospital last night? / 보기 Was, Were, Is / 김 선생님은 어젯밤에 병원에 있었니? | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | ____ the girl a good singer yesterday? / 보기 Was, Were, Is / 그 소녀는 어제 노래를 잘 부르는 사람이었니? | ____ the girl at the school concert yesterday? / 보기 Was, Were, Is / 그 소녀는 어제 학교 음악회에 있었니? | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | ____ my uncle a student last night? / 보기 Was, Were, Is / 삼촌은 어젯밤에 학생이었니? | ____ my uncle at school last night? / 보기 Was, Were, Is / 삼촌은 어젯밤에 학교에 있었니? | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | The twins ____ a student. / 보기 are, am, is / 쌍둥이는 학생이다. | The twins ____ students. / 보기 are, am, is / 쌍둥이는 학생이다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | The children ____ a good singer last week. / 보기 were, was, is / 아이들은 지난주에 노래를 잘 부르는 사람이었다. | The children ____ at the school concert last week. / 보기 were, was, is / 아이들은 지난주에 학교 음악회에 있었다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | ____ the girl a doctor? / 보기 Is, Are, Am / 그 소녀는 의사이니? | ____ the girl a student? / 보기 Is, Are, Am / 그 소녀는 학생이니? | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | ____ our class a good singer last week? / 보기 Was, Were, Is / 우리 반은 지난주에 노래를 잘 부르는 사람이었니? | ____ our class on a field trip last week? / 보기 Was, Were, Is / 우리 반은 지난주에 현장 학습 중이었니? | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | My brother ____ a student yesterday. / 보기 was, were, is / 내 남동생은 어제 학생이었다. | My brother ____ at school yesterday. / 보기 was, were, is / 내 남동생은 어제 학교에 있었다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | The children ____ a doctor yesterday. / 보기 were, was, is / 아이들은 어제 의사였다. | The children ____ in class yesterday. / 보기 were, was, is / 아이들은 어제 수업 중였다. | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| g1 | ____ you a good singer last week? / 보기 Were, Was, Is / 너는 지난주에 노래를 잘 부르는 사람이었니? | ____ you at the school concert last week? / 보기 Were, Was, Is / 너는 지난주에 학교 음악회에 있었니? | 주어의 나이·수·집단 여부와 직업·신분·시간 표현을 맞춤 |
| tn | I ____ you tomorrow. / 보기 will call, called, call / 내일 전화할게. | I ____ you tomorrow. / 보기 will call, called, will to call / 내일 전화할게. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | You ____ books next Monday. / 보기 will read, read, are reading / 너는 다음 월요일에 책을 읽을 것이다. | You ____ books next Monday. / 보기 will read, read, will to read / 너는 다음 월요일에 책을 읽을 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | My brother ____ snacks next Monday. / 보기 will buy, buys, is buying / 내 형은 다음 월요일에 간식을 살 것이다. | My brother ____ snacks next Monday. / 보기 will buy, will to buy, will does buy / 내 형은 다음 월요일에 간식을 살 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | I ____ milk next year. / 보기 will drink, drink, drank / 나는 내년에 우유를 마실 것이다. | I ____ milk next year. / 보기 will drink, will to drink, will does drink / 나는 내년에 우유를 마실 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | My sister ____ the bus next year. / 보기 will catch, catches, caught / 내 여동생은 내년에 버스를 탈 것이다. | My sister ____ the bus next year. / 보기 will catch, will to catch, will does catch / 내 여동생은 내년에 버스를 탈 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | Mina ____ a friend tomorrow. / 보기 will call, is calling, calls / 미나는 내일 친구에게 전화할 것이다. | Mina ____ a friend tomorrow. / 보기 will call, will to call, will does call / 미나는 내일 친구에게 전화할 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | Our teacher ____ pictures tomorrow. / 보기 will draw, is drawing, drew / 우리 선생님은 내일 그림을 그릴 것이다. | Our teacher ____ pictures tomorrow. / 보기 will draw, will to draw, drew / 우리 선생님은 내일 그림을 그릴 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | Tom ____ to music next Monday. / 보기 will listen, listens, listened / 톰은 다음 월요일에 음악을 들 것이다. | Tom ____ to music next Monday. / 보기 will listen, will to listen, listened / 톰은 다음 월요일에 음악을 들 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | My brother ____ breakfast next Monday. / 보기 will eat, is eating, eats / 내 형은 다음 월요일에 아침을 먹을 것이다. | My brother ____ breakfast next Monday. / 보기 will eat, will to eat, will does eat / 내 형은 다음 월요일에 아침을 먹을 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | We ____ English tomorrow. / 보기 will study, studied, study / 우리는 내일 영어를 공부할 것이다. | We ____ English tomorrow. / 보기 will study, studied, will to study / 우리는 내일 영어를 공부할 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | The girls ____ to music tomorrow. / 보기 will listen, listen, are listening / 그 소녀들은 내일 음악을 들 것이다. | The girls ____ to music tomorrow. / 보기 will listen, will to listen, will does listen / 그 소녀들은 내일 음악을 들 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | She ____ pictures next week. / 보기 will draw, draws, is drawing / 그녀는 다음 주에 그림을 그릴 것이다. | She ____ pictures next week. / 보기 will draw, will to draw, will does draw / 그녀는 다음 주에 그림을 그릴 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | We ____ snacks next year. / 보기 will buy, buy, bought / 우리는 내년에 간식을 살 것이다. | We ____ snacks next year. / 보기 will buy, will to buy, bought / 우리는 내년에 간식을 살 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | My sister ____ a friend next week. / 보기 will call, calls, is calling / 내 여동생은 다음 주에 친구에게 전화할 것이다. | My sister ____ a friend next week. / 보기 will call, will to call, will does call / 내 여동생은 다음 주에 친구에게 전화할 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | My brother ____ books next week. / 보기 will read, is reading, reads / 내 형은 다음 주에 책을 읽을 것이다. | My brother ____ books next week. / 보기 will read, will to read, will does read / 내 형은 다음 주에 책을 읽을 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | We ____ in the sea tomorrow. / 보기 will swim, swim, swam / 우리는 내일 바다에서 수영할 것이다. | We ____ in the sea tomorrow. / 보기 will swim, will to swim, will does swim / 우리는 내일 바다에서 수영할 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | The students ____ snacks next week. / 보기 will buy, bought, are buying / 학생들은 다음 주에 간식을 살 것이다. | The students ____ snacks next week. / 보기 will buy, bought, will to buy / 학생들은 다음 주에 간식을 살 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | Mina ____ snacks next year. / 보기 will buy, bought, is buying / 미나는 내년에 간식을 살 것이다. | Mina ____ snacks next year. / 보기 will buy, bought, will to buy / 미나는 내년에 간식을 살 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | Mina ____ the window next Monday. / 보기 will open, opened, opens / 미나는 다음 월요일에 창문을 열 것이다. | Mina ____ the window next Monday. / 보기 will open, opened, will to open / 미나는 다음 월요일에 창문을 열 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | The girls ____ milk next year. / 보기 will drink, are drinking, drank / 그 소녀들은 내년에 우유를 마실 것이다. | The girls ____ milk next year. / 보기 will drink, will to drink, will does drink / 그 소녀들은 내년에 우유를 마실 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | You ____ dinner tomorrow. / 보기 will cook, cook, are cooking / 너는 내일 저녁을 요리할 것이다. | You ____ dinner tomorrow. / 보기 will cook, will to cook, will does cook / 너는 내일 저녁을 요리할 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | My brother ____ the room next week. / 보기 will clean, cleans, is cleaning / 내 형은 다음 주에 방을 청소할 것이다. | My brother ____ the room next week. / 보기 will clean, will to clean, will does clean / 내 형은 다음 주에 방을 청소할 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | Tom ____ cookies next year. / 보기 will make, is making, makes / 톰은 내년에 쿠키를 만들 것이다. | Tom ____ cookies next year. / 보기 will make, will to make, will does make / 톰은 내년에 쿠키를 만들 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | Mina ____ cookies tomorrow. / 보기 will make, made, is making / 미나는 내일 쿠키를 만들 것이다. | Mina ____ cookies tomorrow. / 보기 will make, made, will to make / 미나는 내일 쿠키를 만들 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | I ____ to work next year. / 보기 will walk, walk, am walking / 나는 내년에 직장에 걸어갈 것이다. | I ____ to work next year. / 보기 will walk, will to walk, will does walk / 나는 내년에 직장에 걸어갈 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | I ____ the guitar next week. / 보기 will play, am playing, played / 나는 다음 주에 기타를 칠 것이다. | I ____ the guitar next week. / 보기 will play, will to play, played / 나는 다음 주에 기타를 칠 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | I wonder what he ____ tomorrow. / 보기 will do, does, did / 그가 내일 뭘 할지 궁금하다. | I wonder what he ____ tomorrow. / 보기 will do, will to do, will does do / 그가 내일 뭘 할지 궁금하다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | My sister ____ soccer tomorrow morning. / 보기 will play, plays, played / 내 여동생은 내일 아침에 축구를 할 것이다. | My sister ____ soccer tomorrow morning. / 보기 will play, will to play, played / 내 여동생은 내일 아침에 축구를 할 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | My uncle ____ a smartphone tomorrow. / 보기 will use, uses, used / 삼촌은 내일 스마트폰을 사용할 것이다. | My uncle ____ a smartphone tomorrow. / 보기 will use, will to use, used / 삼촌은 내일 스마트폰을 사용할 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | My sister ____ my uncle next month. / 보기 will visit, visits, visited / 내 여동생은 다음 달에 삼촌을 방문할 것이다. | My sister ____ my uncle next month. / 보기 will visit, will to visit, visited / 내 여동생은 다음 달에 삼촌을 방문할 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | The teacher ____ old books next month. / 보기 will sell, sells, sold / 선생님은 다음 달에 헌책을 팔 것이다. | The teacher ____ old books next month. / 보기 will sell, will to sell, will does sell / 선생님은 다음 달에 헌책을 팔 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | My brother ____ old books next month. / 보기 will sell, sells, sold / 내 남동생은 다음 달에 헌책을 팔 것이다. | My brother ____ old books next month. / 보기 will sell, will to sell, will does sell / 내 남동생은 다음 달에 헌책을 팔 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | The children ____ the dishes next week. / 보기 will wash, wash, washed / 아이들은 다음 주에 설거지를 할 것이다. | The children ____ the dishes next week. / 보기 will wash, will to wash, washed / 아이들은 다음 주에 설거지를 할 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | I ____ a cake next week. / 보기 will make, make, made / 나는 다음 주에 케이크를 만들 것이다. | I ____ a cake next week. / 보기 will make, will to make, made / 나는 다음 주에 케이크를 만들 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | My sister ____ old books tomorrow. / 보기 will sell, sells, sold / 내 여동생은 내일 헌책을 팔 것이다. | My sister ____ old books tomorrow. / 보기 will sell, will to sell, will does sell / 내 여동생은 내일 헌책을 팔 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | He ____ some bread tomorrow. / 보기 will buy, buys, bought / 그는 내일 빵을 살 것이다. | He ____ some bread tomorrow. / 보기 will buy, will to buy, bought / 그는 내일 빵을 살 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | We ____ a movie tomorrow morning. / 보기 will watch, watch, watched / 우리는 내일 아침에 영화를 볼 것이다. | We ____ a movie tomorrow morning. / 보기 will watch, will to watch, watched / 우리는 내일 아침에 영화를 볼 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | We ____ Chinese tomorrow morning. / 보기 will learn, learn, learned / 우리는 내일 아침에 중국어를 배울 것이다. | We ____ Chinese tomorrow morning. / 보기 will learn, will to learn, learned / 우리는 내일 아침에 중국어를 배울 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | I ____ some bread tomorrow morning. / 보기 will buy, buy, bought / 나는 내일 아침에 빵을 살 것이다. | I ____ some bread tomorrow morning. / 보기 will buy, will to buy, bought / 나는 내일 아침에 빵을 살 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | I ____ the computer next week. / 보기 will fix, fix, fixed / 나는 다음 주에 컴퓨터를 고칠 것이다. | I ____ the computer next week. / 보기 will fix, will to fix, fixed / 나는 다음 주에 컴퓨터를 고칠 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | The teacher ____ a new bag next week. / 보기 will buy, buys, bought / 선생님은 다음 주에 새 가방을 살 것이다. | The teacher ____ a new bag next week. / 보기 will buy, will to buy, bought / 선생님은 다음 주에 새 가방을 살 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | They ____ a house tomorrow. / 보기 will build, build, built / 그들은 내일 집을 짓을 것이다. | They ____ a house tomorrow. / 보기 will build, will to build, will does build / 그들은 내일 집을 짓을 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | The children ____ old books tomorrow morning. / 보기 will sell, sell, sold / 아이들은 내일 아침에 헌책을 팔 것이다. | The children ____ old books tomorrow morning. / 보기 will sell, will to sell, will does sell / 아이들은 내일 아침에 헌책을 팔 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | The twins ____ Chinese tomorrow morning. / 보기 will learn, learn, learned / 쌍둥이는 내일 아침에 중국어를 배울 것이다. | The twins ____ Chinese tomorrow morning. / 보기 will learn, will to learn, learned / 쌍둥이는 내일 아침에 중국어를 배울 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | He ____ my grandmother next week. / 보기 will call, calls, called / 그는 다음 주에 할머니께 전화를 할 것이다. | He ____ my grandmother next week. / 보기 will call, will to call, called / 그는 다음 주에 할머니께 전화를 할 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | My brother ____ the bag next Sunday. / 보기 will carry, carries, carried / 내 남동생은 다음 일요일에 가방을 들 것이다. | My brother ____ the bag next Sunday. / 보기 will carry, will to carry, carried / 내 남동생은 다음 일요일에 가방을 들 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | The twins ____ my lunch tomorrow. / 보기 will bring, bring, brought / 쌍둥이는 내일 도시락을 가져올 것이다. | The twins ____ my lunch tomorrow. / 보기 will bring, will to bring, will does bring / 쌍둥이는 내일 도시락을 가져올 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | The girl ____ music tomorrow morning. / 보기 will love, loves, loved / 그 소녀는 내일 아침에 음악을 사랑할 것이다. | The girl ____ music tomorrow morning. / 보기 will love, will to love, loved / 그 소녀는 내일 아침에 음악을 사랑할 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | The boys ____ music next month. / 보기 will love, love, loved / 소년들은 다음 달에 음악을 사랑할 것이다. | The boys ____ music next month. / 보기 will love, will to love, loved / 소년들은 다음 달에 음악을 사랑할 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | We ____ computer games tomorrow. / 보기 will play, play, played / 우리는 내일 컴퓨터 게임을 할 것이다. | We ____ computer games tomorrow. / 보기 will play, will to play, played / 우리는 내일 컴퓨터 게임을 할 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | The students ____ math next week. / 보기 will study, study, studied / 학생들은 다음 주에 수학을 공부할 것이다. | The students ____ math next week. / 보기 will study, will to study, studied / 학생들은 다음 주에 수학을 공부할 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | My brother ____ the computer tomorrow. / 보기 will fix, fixes, fixed / 내 남동생은 내일 컴퓨터를 고칠 것이다. | My brother ____ the computer tomorrow. / 보기 will fix, will to fix, fixed / 내 남동생은 내일 컴퓨터를 고칠 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | They ____ in the river next week. / 보기 will swim, swim, swam / 그들은 다음 주에 강에서 수영할 것이다. | They ____ in the river next week. / 보기 will swim, will to swim, will does swim / 그들은 다음 주에 강에서 수영할 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | Tom ____ a wallet next Sunday. / 보기 will find, finds, found / 톰은 다음 일요일에 지갑을 찾을 것이다. | Tom ____ a wallet next Sunday. / 보기 will find, will to find, will does find / 톰은 다음 일요일에 지갑을 찾을 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | She ____ math tomorrow. / 보기 will study, studies, studied / 그녀는 내일 수학을 공부할 것이다. | She ____ math tomorrow. / 보기 will study, will to study, studied / 그녀는 내일 수학을 공부할 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | The students ____ to bed tomorrow morning. / 보기 will go, go, went / 학생들은 내일 아침에 잠자리에 들 것이다. | The students ____ to bed tomorrow morning. / 보기 will go, will to go, went / 학생들은 내일 아침에 잠자리에 들 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | The twins ____ TV tomorrow morning. / 보기 will watch, watch, watched / 쌍둥이는 내일 아침에 TV를 볼 것이다. | The twins ____ TV tomorrow morning. / 보기 will watch, will to watch, watched / 쌍둥이는 내일 아침에 TV를 볼 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | She ____ a smartphone next week. / 보기 will use, uses, used / 그녀는 다음 주에 스마트폰을 사용할 것이다. | She ____ a smartphone next week. / 보기 will use, will to use, used / 그녀는 다음 주에 스마트폰을 사용할 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | He ____ a picture next month. / 보기 will draw, draws, drew / 그는 다음 달에 그림을 그릴 것이다. | He ____ a picture next month. / 보기 will draw, will to draw, drew / 그는 다음 달에 그림을 그릴 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | The boys ____ to the market next Sunday. / 보기 will go, go, went / 소년들은 다음 일요일에 시장에 갈 것이다. | The boys ____ to the market next Sunday. / 보기 will go, will to go, went / 소년들은 다음 일요일에 시장에 갈 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | The twins ____ my friends next Sunday. / 보기 will meet, meet, met / 쌍둥이는 다음 일요일에 친구들을 만날 것이다. | The twins ____ my friends next Sunday. / 보기 will meet, will to meet, met / 쌍둥이는 다음 일요일에 친구들을 만날 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | We ____ English next Sunday. / 보기 will study, study, studied / 우리는 다음 일요일에 영어를 공부할 것이다. | We ____ English next Sunday. / 보기 will study, will to study, studied / 우리는 다음 일요일에 영어를 공부할 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | My brother ____ a book tomorrow morning. / 보기 will read, reads, read / 내 남동생은 내일 아침에 책을 읽을 것이다. | My brother ____ a book tomorrow morning. / 보기 will read, will to read, read / 내 남동생은 내일 아침에 책을 읽을 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | You ____ to school tomorrow. / 보기 will walk, walk, walked / 너는 내일 학교까지 걷을 것이다. | You ____ to school tomorrow. / 보기 will walk, will to walk, walked / 너는 내일 학교까지 걷을 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | My friends ____ the piano next month. / 보기 will play, play, played / 내 친구들은 다음 달에 피아노를 칠 것이다. | My friends ____ the piano next month. / 보기 will play, will to play, played / 내 친구들은 다음 달에 피아노를 칠 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | The children ____ in the park next Sunday. / 보기 will run, run, ran / 아이들은 다음 일요일에 공원에서 달릴 것이다. | The children ____ in the park next Sunday. / 보기 will run, will to run, ran / 아이들은 다음 일요일에 공원에서 달릴 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | Our class ____ a new bag next month. / 보기 will buy, buys, bought / 우리 반은 다음 달에 새 가방을 살 것이다. | Our class ____ a new bag next month. / 보기 will buy, will to buy, bought / 우리 반은 다음 달에 새 가방을 살 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | My friends ____ the computer next Sunday. / 보기 will fix, fix, fixed / 내 친구들은 다음 일요일에 컴퓨터를 고칠 것이다. | My friends ____ the computer next Sunday. / 보기 will fix, will to fix, fixed / 내 친구들은 다음 일요일에 컴퓨터를 고칠 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | They ____ a wallet next Sunday. / 보기 will find, find, found / 그들은 다음 일요일에 지갑을 찾을 것이다. | They ____ a wallet next Sunday. / 보기 will find, will to find, will does find / 그들은 다음 일요일에 지갑을 찾을 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | Jisu ____ at the library tomorrow. / 보기 will study, studies, studied / 지수는 내일 도서관에서 공부할 것이다. | Jisu ____ at the library tomorrow. / 보기 will study, will to study, studied / 지수는 내일 도서관에서 공부할 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| tn | The teacher ____ soccer tomorrow morning. / 보기 will play, plays, played / 선생님은 내일 아침에 축구를 할 것이다. | The teacher ____ soccer tomorrow morning. / 보기 will play, will to play, played / 선생님은 내일 아침에 축구를 할 것이다. | 미래의 약속·일정에 사용할 수 있는 현재형 보기를 문법상 틀린 조동사 형태로 교체 |
| rp | I found a song, ____ is on the table. / 보기 which, that, who / 나는 탁자 위에 있는 노래를 발견했다. | I found an album, ____ is on the table. / 보기 which, that, who / 나는 탁자 위에 있는 음반을 발견했다. | 책상 위에 놓이거나 외형이 있는 물건을 가리키도록 관계절의 선행사를 수정 |
| ps | The meeting ____ by my uncle every morning. / 보기 is held, held, is holding / 그 회의는 매일 아침 삼촌에 의해 열린다. | The meeting ____ by the team leader every morning. / 보기 is held, held, is holding / 그 회의는 매일 아침 팀장에 의해 열린다. | 수동태의 대상과 행위자를 일상적인 맥락으로 연결 |
| ps | The emails ____ sent by many people every week. / 보기 are, were, is / 그 이메일들은 매주 많은 사람들에 의해 전송된다. | The emails ____ sent by the office staff every week. / 보기 are, were, is / 그 이메일들은 매주 사무실 직원들에 의해 전송된다. | 수동태의 대상과 행위자를 일상적인 맥락으로 연결 |
| ps | The cars ____ washed by many people last week. / 보기 were, are, was / 그 차들은 지난주에 많은 사람들에 의해 세차되었다. | The cars ____ washed by the car wash staff last week. / 보기 were, are, was / 그 차들은 지난주에 세차장 직원들에 의해 세차되었다. | 수동태의 대상과 행위자를 일상적인 맥락으로 연결 |
| ps | The meeting is ____ by my mother every day. / 보기 held, hold, holding / 그 회의는 매일 우리 엄마에 의해 열린다. | The meeting is ____ by the team leader every day. / 보기 held, hold, holding / 그 회의는 매일 팀장에 의해 열린다. | 수동태의 대상과 행위자를 일상적인 맥락으로 연결 |
| ps | The meeting is ____ by the police every day. / 보기 held, hold, holding / 그 회의는 매일 경찰에 의해 열린다. | The meeting is ____ by the team leader every day. / 보기 held, hold, holding / 그 회의는 매일 팀장에 의해 열린다. | 수동태의 대상과 행위자를 일상적인 맥락으로 연결 |
| ps | The meeting ____ by my uncle yesterday. / 보기 was held, held, was holding / 그 회의는 어제 삼촌에 의해 열렸다. | The meeting ____ by the team leader yesterday. / 보기 was held, held, was holding / 그 회의는 어제 팀장에 의해 열렸다. | 수동태의 대상과 행위자를 일상적인 맥락으로 연결 |
| ps | The emails ____ by my mother last year. / 보기 were sent, sent, were sending / 그 이메일들은 작년에 우리 엄마에 의해 전송되었다. | The emails ____ by the office staff last year. / 보기 were sent, sent, were sending / 그 이메일들은 작년에 사무실 직원들에 의해 전송되었다. | 수동태의 대상과 행위자를 일상적인 맥락으로 연결 |
| ps | The cookies are ____ by a famous artist every morning. / 보기 eaten, ate, eat / 그 쿠키들은 매일 아침 한 유명한 화가에 의해 먹힌다. | The cookies are ____ by the children every morning. / 보기 eaten, ate, eat / 그 쿠키들은 매일 아침 아이들에 의해 먹힌다. | 수동태의 대상과 행위자를 일상적인 맥락으로 연결 |
| ps | The cars were ____ by my uncle yesterday. / 보기 washed, wash, washing / 그 차들은 어제 삼촌에 의해 세차되었다. | The cars were ____ by the car wash staff yesterday. / 보기 washed, wash, washing / 그 차들은 어제 세차장 직원들에 의해 세차되었다. | 수동태의 대상과 행위자를 일상적인 맥락으로 연결 |
| ps | The dishes ____ washed by the police every day. / 보기 are, were, is / 그 접시들은 매일 경찰에 의해 씻긴다. | The dishes ____ washed by the kitchen staff every day. / 보기 are, were, is / 그 접시들은 매일 주방 직원들에 의해 씻긴다. | 수동태의 대상과 행위자를 일상적인 맥락으로 연결 |
| ps | The cars ____ washed by my uncle last year. / 보기 were, are, was / 그 차들은 작년에 삼촌에 의해 세차되었다. | The cars ____ washed by the car wash staff last year. / 보기 were, are, was / 그 차들은 작년에 세차장 직원들에 의해 세차되었다. | 수동태의 대상과 행위자를 일상적인 맥락으로 연결 |
| ps | The dishes were ____ by my mother last week. / 보기 washed, wash, washing / 그 접시들은 지난주에 우리 엄마에 의해 씻겼다. | The dishes were ____ by the kitchen staff last week. / 보기 washed, wash, washing / 그 접시들은 지난주에 주방 직원들에 의해 씻겼다. | 수동태의 대상과 행위자를 일상적인 맥락으로 연결 |
| ps | The dishes were ____ by many people last night. / 보기 washed, wash, washing / 그 접시들은 어젯밤에 많은 사람들에 의해 씻겼다. | The dishes were ____ by the kitchen staff last night. / 보기 washed, wash, washing / 그 접시들은 어젯밤에 주방 직원들에 의해 씻겼다. | 수동태의 대상과 행위자를 일상적인 맥락으로 연결 |
| ps | The cookies ____ eaten by a famous artist last week. / 보기 were, are, was / 그 쿠키들은 지난주에 한 유명한 화가에 의해 먹혔다. | The cookies ____ eaten by the children last week. / 보기 were, are, was / 그 쿠키들은 지난주에 아이들에 의해 먹혔다. | 수동태의 대상과 행위자를 일상적인 맥락으로 연결 |
| ps | The emails are ____ by my uncle every day. / 보기 sent, send, sending / 그 이메일들은 매일 삼촌에 의해 전송된다. | The emails are ____ by the office staff every day. / 보기 sent, send, sending / 그 이메일들은 매일 사무실 직원들에 의해 전송된다. | 수동태의 대상과 행위자를 일상적인 맥락으로 연결 |
| ps | The cookies ____ by my uncle every day. / 보기 are eaten, ate, are eating / 그 쿠키들은 매일 삼촌에 의해 먹힌다. | The cookies ____ by the children every day. / 보기 are eaten, ate, are eating / 그 쿠키들은 매일 아이들에 의해 먹힌다. | 수동태의 대상과 행위자를 일상적인 맥락으로 연결 |
| ps | The emails ____ by a famous artist last year. / 보기 were sent, sent, were sending / 그 이메일들은 작년에 한 유명한 화가에 의해 전송되었다. | The emails ____ by the office staff last year. / 보기 were sent, sent, were sending / 그 이메일들은 작년에 사무실 직원들에 의해 전송되었다. | 수동태의 대상과 행위자를 일상적인 맥락으로 연결 |
| ps | The cars were ____ by my uncle last week. / 보기 washed, wash, washing / 그 차들은 지난주에 삼촌에 의해 세차되었다. | The cars were ____ by the car wash staff last week. / 보기 washed, wash, washing / 그 차들은 지난주에 세차장 직원들에 의해 세차되었다. | 수동태의 대상과 행위자를 일상적인 맥락으로 연결 |
| ps | The cars ____ by a famous artist every morning. / 보기 are washed, washed, are washing / 그 차들은 매일 아침 한 유명한 화가에 의해 세차된다. | The cars ____ by the car wash staff every morning. / 보기 are washed, washed, are washing / 그 차들은 매일 아침 세차장 직원들에 의해 세차된다. | 수동태의 대상과 행위자를 일상적인 맥락으로 연결 |
| ps | The dishes are ____ by my uncle every day. / 보기 washed, wash, washing / 그 접시들은 매일 삼촌에 의해 씻긴다. | The dishes are ____ by the kitchen staff every day. / 보기 washed, wash, washing / 그 접시들은 매일 주방 직원들에 의해 씻긴다. | 수동태의 대상과 행위자를 일상적인 맥락으로 연결 |
| ps | The cars ____ by the police last night. / 보기 were washed, washed, were washing / 그 차들은 어젯밤에 경찰에 의해 세차되었다. | The cars ____ by the car wash staff last night. / 보기 were washed, washed, were washing / 그 차들은 어젯밤에 세차장 직원들에 의해 세차되었다. | 수동태의 대상과 행위자를 일상적인 맥락으로 연결 |
| ps | The cookies ____ by my uncle last week. / 보기 were eaten, ate, were eating / 그 쿠키들은 지난주에 삼촌에 의해 먹혔다. | The cookies ____ by the children last week. / 보기 were eaten, ate, were eating / 그 쿠키들은 지난주에 아이들에 의해 먹혔다. | 수동태의 대상과 행위자를 일상적인 맥락으로 연결 |
| ps | The cars ____ by my uncle last year. / 보기 were washed, washed, were washing / 그 차들은 작년에 삼촌에 의해 세차되었다. | The cars ____ by the car wash staff last year. / 보기 were washed, washed, were washing / 그 차들은 작년에 세차장 직원들에 의해 세차되었다. | 수동태의 대상과 행위자를 일상적인 맥락으로 연결 |
| ps | The cars ____ by the police last year. / 보기 were washed, washed, were washing / 그 차들은 작년에 경찰에 의해 세차되었다. | The cars ____ by the car wash staff last year. / 보기 were washed, washed, were washing / 그 차들은 작년에 세차장 직원들에 의해 세차되었다. | 수동태의 대상과 행위자를 일상적인 맥락으로 연결 |
| ps | The cars ____ by my mother last week. / 보기 were washed, washed, were washing / 그 차들은 지난주에 우리 엄마에 의해 세차되었다. | The cars ____ by the car wash staff last week. / 보기 were washed, washed, were washing / 그 차들은 지난주에 세차장 직원들에 의해 세차되었다. | 수동태의 대상과 행위자를 일상적인 맥락으로 연결 |
| ps | The meeting ____ by my mother yesterday. / 보기 was held, held, was holding / 그 회의는 어제 우리 엄마에 의해 열렸다. | The meeting ____ by the team leader yesterday. / 보기 was held, held, was holding / 그 회의는 어제 팀장에 의해 열렸다. | 수동태의 대상과 행위자를 일상적인 맥락으로 연결 |
| ps | The dishes ____ by the police last night. / 보기 were washed, washed, were washing / 그 접시들은 어젯밤에 경찰에 의해 씻겼다. | The dishes ____ by the kitchen staff last night. / 보기 were washed, washed, were washing / 그 접시들은 어젯밤에 주방 직원들에 의해 씻겼다. | 수동태의 대상과 행위자를 일상적인 맥락으로 연결 |
| pf | We ____ already visited grandparents. / 보기 have, has, did / 우리는 이미 조부모님을 방문했다. | We ____ already visited our grandparents. / 보기 have, has, did / 우리는 이미 조부모님을 방문했다. | 말하는 사람과 조부모의 관계를 명시 |
| pf | We have already ____ grandparents. / 보기 visited, visit, visiting / 우리는 이미 조부모님을 방문했다. | We have already ____ our grandparents. / 보기 visited, visit, visiting / 우리는 이미 조부모님을 방문했다. | 말하는 사람과 조부모의 관계를 명시 |
| pf | We have just ____ grandparents. / 보기 visited, visit, visiting / 우리는 방금 조부모님을 방문했다. | We have just ____ our grandparents. / 보기 visited, visit, visiting / 우리는 방금 조부모님을 방문했다. | 말하는 사람과 조부모의 관계를 명시 |
| pf | We haven't ____ grandparents yet. / 보기 visited, visit, visiting / 우리는 아직 조부모님을 방문하지 않았다. | We haven't ____ our grandparents yet. / 보기 visited, visit, visiting / 우리는 아직 조부모님을 방문하지 않았다. | 말하는 사람과 조부모의 관계를 명시 |
| pf | ____ we visited grandparents yet? / 보기 Have, Did, Is / 우리는 벌써 조부모님을 방문했니? | ____ we visited our grandparents yet? / 보기 Have, Did, Is / 우리는 벌써 조부모님을 방문했니? | 말하는 사람과 조부모의 관계를 명시 |
| pf | We have never ____ grandparents. / 보기 visited, visit, visiting / 우리는 조부모님을 방문한 적이 없다. | We have never ____ our grandparents. / 보기 visited, visit, visiting / 우리는 조부모님을 방문한 적이 없다. | 말하는 사람과 조부모의 관계를 명시 |
| pf | Have we ever ____ grandparents? / 보기 visited, visit, visiting / 우리는 조부모님을 방문한 적이 있니? | Have we ever ____ our grandparents? / 보기 visited, visit, visiting / 우리는 조부모님을 방문한 적이 있니? | 말하는 사람과 조부모의 관계를 명시 |
| pf | We have ____ grandparents three times. / 보기 visited, visit, visiting / 우리는 조부모님을 세 번 방문한 적이 있다. | We have ____ our grandparents three times. / 보기 visited, visit, visiting / 우리는 조부모님을 세 번 방문한 적이 있다. | 말하는 사람과 조부모의 관계를 명시 |
| pf | By the time we arrived, we had already ____ grandparents. / 보기 visited, visit, visiting / 우리가 도착했을 때 우리는 이미 조부모님을 방문해 버렸다. | By the time we arrived, we had already ____ our grandparents. / 보기 visited, visit, visiting / 우리가 도착했을 때 우리는 이미 조부모님을 방문해 버렸다. | 말하는 사람과 조부모의 관계를 명시 |
| pf | He ____ already visited grandparents. / 보기 has, have, did / 그는 이미 조부모님을 방문했다. | He ____ already visited our grandparents. / 보기 has, have, did / 그는 이미 조부모님을 방문했다. | 말하는 사람과 조부모의 관계를 명시 |
| pf | He has already ____ grandparents. / 보기 visited, visit, visiting / 그는 이미 조부모님을 방문했다. | He has already ____ our grandparents. / 보기 visited, visit, visiting / 그는 이미 조부모님을 방문했다. | 말하는 사람과 조부모의 관계를 명시 |
| pf | He has just ____ grandparents. / 보기 visited, visit, visiting / 그는 방금 조부모님을 방문했다. | He has just ____ our grandparents. / 보기 visited, visit, visiting / 그는 방금 조부모님을 방문했다. | 말하는 사람과 조부모의 관계를 명시 |
| pf | He hasn't ____ grandparents yet. / 보기 visited, visit, visiting / 그는 아직 조부모님을 방문하지 않았다. | He hasn't ____ our grandparents yet. / 보기 visited, visit, visiting / 그는 아직 조부모님을 방문하지 않았다. | 말하는 사람과 조부모의 관계를 명시 |
| pf | ____ he visited grandparents yet? / 보기 Has, Did, Is / 그는 벌써 조부모님을 방문했니? | ____ he visited our grandparents yet? / 보기 Has, Did, Is / 그는 벌써 조부모님을 방문했니? | 말하는 사람과 조부모의 관계를 명시 |
| pf | He has never ____ grandparents. / 보기 visited, visit, visiting / 그는 조부모님을 방문한 적이 없다. | He has never ____ our grandparents. / 보기 visited, visit, visiting / 그는 조부모님을 방문한 적이 없다. | 말하는 사람과 조부모의 관계를 명시 |
| pf | Has he ever ____ grandparents? / 보기 visited, visit, visiting / 그는 조부모님을 방문한 적이 있니? | Has he ever ____ our grandparents? / 보기 visited, visit, visiting / 그는 조부모님을 방문한 적이 있니? | 말하는 사람과 조부모의 관계를 명시 |
| pf | He has ____ grandparents three times. / 보기 visited, visit, visiting / 그는 조부모님을 세 번 방문한 적이 있다. | He has ____ our grandparents three times. / 보기 visited, visit, visiting / 그는 조부모님을 세 번 방문한 적이 있다. | 말하는 사람과 조부모의 관계를 명시 |
| pf | By the time we arrived, he had already ____ grandparents. / 보기 visited, visit, visiting / 우리가 도착했을 때 그는 이미 조부모님을 방문해 버렸다. | By the time we arrived, he had already ____ our grandparents. / 보기 visited, visit, visiting / 우리가 도착했을 때 그는 이미 조부모님을 방문해 버렸다. | 말하는 사람과 조부모의 관계를 명시 |
| pf | My sister ____ already visited grandparents. / 보기 has, have, did / 내 여동생은 이미 조부모님을 방문했다. | My sister ____ already visited our grandparents. / 보기 has, have, did / 내 여동생은 이미 조부모님을 방문했다. | 말하는 사람과 조부모의 관계를 명시 |
| pn | He is in ____ hospital with a broken leg. / 보기 ×, the, a / 그는 다리가 부러져 입원 중이다. | In British English, he is in ____ hospital with a broken leg. / 보기 ×, an, some / 영국 영어 표현으로 그는 다리가 부러져 입원 중이다. | 영국식 무관사 표현의 맥락을 명시하고 미국식 정답과 겹치는 보기를 교체 |
| pn | We play ____ swimming after school. / 보기 ×, a, the / 우리는 방과 후에 수영을 한다. | We go ____ swimming after school. / 보기 ×, a, the / 우리는 방과 후에 수영을 한다. | 수영에는 play 대신 go swimming을 사용 |
| ot | We usually meet ____ May 5th. / 보기 on, in, at / 우리는 보통 5월 5일에 만난다. | Our reunion is ____ May 5th. / 보기 on, in, at / 우리 동창회는 5월 5일에 열린다. | 특정 날짜와 습관을 뜻하는 usually의 어색한 결합을 자연스러운 일정으로 수정 |
| ot | We usually meet ____ April 1st. / 보기 on, at, in / 우리는 보통 4월 1일에 만난다. | Our reunion is ____ April 1st. / 보기 on, at, in / 우리 동창회는 4월 1일에 열린다. | 특정 날짜와 습관을 뜻하는 usually의 어색한 결합을 자연스러운 일정으로 수정 |
| ot | We usually meet ____ the morning of May 5th. / 보기 on, at, in / 우리는 보통 5월 5일 아침에 만난다. | Our reunion is ____ the morning of May 5th. / 보기 on, at, in / 우리 동창회는 5월 5일 아침에 열린다. | 특정 날짜와 습관을 뜻하는 usually의 어색한 결합을 자연스러운 일정으로 수정 |
| rs | He said, 'I am happy.' → He said that he ____ happy. / 보기 was, is, am / 그는 행복하다고 말했다. | He said, 'I am happy.' → He said that he ____ happy. / 보기 was, be, am / 그는 행복하다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | She said, 'I like cats.' → She said that she ____ cats. / 보기 liked, likes, like / 그녀는 고양이를 좋아한다고 말했다. | She said, 'I like cats.' → She said that she ____ cats. / 보기 liked, liking, like / 그녀는 고양이를 좋아한다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | He told me that he ____ busy. / 보기 was, is, were / 그는 내게 자기가 바쁘다고 말했다. | He told me that he ____ busy. / 보기 was, be, were / 그는 내게 자기가 바쁘다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | I thought that he ____ honest. / 보기 was, is, will be / 나는 그가 정직하다고 생각했다. | I thought that he ____ honest. / 보기 was, be, will be / 나는 그가 정직하다고 생각했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | She said that she ____ never been to Paris. / 보기 had, has, have / 그녀는 파리에 가 본 적이 없다고 말했다. | She said that she ____ never been to Paris. / 보기 had, having, have / 그녀는 파리에 가 본 적이 없다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | She asked, 'Will you help me?' → She asked me whether I ____ her. / 보기 would help, will help, help / 그녀는 내게 도와줄 수 있느냐고 물었다. | She asked, 'Will you help me?' → She asked me whether I ____ her. / 보기 would help, will to help, help / 그녀는 내게 도와줄 수 있느냐고 물었다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | He said that he ____ finished his work by then. / 보기 had, has, have / 그는 그때까지는 일을 끝냈다고 말했다. | He said that he ____ finished his work by then. / 보기 had, having, have / 그는 그때까지는 일을 끝냈다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | Jisu said, "I am busy." → Jisu said that she ____ busy. / 보기 was, is, am / 지수는 바쁘다고 말했다. | Jisu said, "I am busy." → Jisu said that she ____ busy. / 보기 was, be, am / 지수는 바쁘다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | He asked me what my name ____. / 보기 was, is, were / 그는 내게 이름이 뭐냐고 물었다. | He asked me what my name ____. / 보기 was, be, were / 그는 내게 이름이 뭐냐고 물었다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | Jisu said, "I like this song." → Jisu said that she ____ that song. / 보기 liked, likes, like / 지수는 이 노래를 좋아한다고 말했다. | Jisu said, "I like this song." → Jisu said that she ____ that song. / 보기 liked, liking, like / 지수는 이 노래를 좋아한다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | Jisu said, "I live in Daegu." → Jisu said that she ____ in Daegu. / 보기 lived, live, lives / 지수는 대구에 산다고 말했다. | Jisu said, "I live in Daegu." → Jisu said that she ____ in Daegu. / 보기 lived, live, living / 지수는 대구에 산다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | She said that she ____ swim. / 보기 could, can, will / 그녀는 수영할 수 있다고 말했다. | She said that she ____ swim. / 보기 could, could to, will / 그녀는 수영할 수 있다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | My father said, "I am busy." → My father said that he ____ busy. / 보기 was, is, am / 아버지는 바쁘다고 말했다. | My father said, "I am busy." → My father said that he ____ busy. / 보기 was, be, am / 아버지는 바쁘다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | Tom said, "I live in Daegu." → Tom said that he ____ in Daegu. / 보기 lived, live, lives / 톰은 대구에 산다고 말했다. | Tom said, "I live in Daegu." → Tom said that he ____ in Daegu. / 보기 lived, live, living / 톰은 대구에 산다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | Mina said, "I like this song." → Mina said that she ____ that song. / 보기 liked, likes, like / 미나는 이 노래를 좋아한다고 말했다. | Mina said, "I like this song." → Mina said that she ____ that song. / 보기 liked, liking, like / 미나는 이 노래를 좋아한다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | They said that they ____ happy. / 보기 were, are, was / 그들은 행복하다고 말했다. | They said that they ____ happy. / 보기 were, being, was / 그들은 행복하다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | He said that he ____ tired. / 보기 was, is, am / 그는 피곤하다고 말했다. | He said that he ____ tired. / 보기 was, be, am / 그는 피곤하다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | Tom said, "I am busy." → Tom said that he ____ busy. / 보기 was, is, am / 톰은 바쁘다고 말했다. | Tom said, "I am busy." → Tom said that he ____ busy. / 보기 was, be, am / 톰은 바쁘다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | Mina said, "I have a cold." → Mina said that she ____ a cold. / 보기 had, has, have / 미나는 감기에 걸렸다고 말했다. | Mina said, "I have a cold." → Mina said that she ____ a cold. / 보기 had, having, have / 미나는 감기에 걸렸다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | Tom said, "I want a new bike." → Tom said that he ____ a new bike. / 보기 wanted, wants, want / 톰은 새 자전거를 원한다고 말했다. | Tom said, "I want a new bike." → Tom said that he ____ a new bike. / 보기 wanted, wanting, want / 톰은 새 자전거를 원한다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | My father said, "I want a new bike." → My father said that he ____ a new bike. / 보기 wanted, wants, want / 아버지는 새 자전거를 원한다고 말했다. | My father said, "I want a new bike." → My father said that he ____ a new bike. / 보기 wanted, wanting, want / 아버지는 새 자전거를 원한다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | Jisu said, "I want a new bike." → Jisu said that she ____ a new bike. / 보기 wanted, wants, want / 지수는 새 자전거를 원한다고 말했다. | Jisu said, "I want a new bike." → Jisu said that she ____ a new bike. / 보기 wanted, wanting, want / 지수는 새 자전거를 원한다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | Mina said, "I live in Daegu." → Mina said that she ____ in Daegu. / 보기 lived, live, lives / 미나는 대구에 산다고 말했다. | Mina said, "I live in Daegu." → Mina said that she ____ in Daegu. / 보기 lived, live, living / 미나는 대구에 산다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | Jisu said, "I am studying English." → Jisu said that she ____ studying English. / 보기 was, is, am / 지수는 영어를 공부하고 있다고 말했다. | Jisu said, "I am studying English." → Jisu said that she ____ studying English. / 보기 was, be, am / 지수는 영어를 공부하고 있다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | My father said, "I like this song." → My father said that he ____ that song. / 보기 liked, likes, like / 아버지는 이 노래를 좋아한다고 말했다. | My father said, "I like this song." → My father said that he ____ that song. / 보기 liked, liking, like / 아버지는 이 노래를 좋아한다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | My father said, "I live in Daegu." → My father said that he ____ in Daegu. / 보기 lived, live, lives / 아버지는 대구에 산다고 말했다. | My father said, "I live in Daegu." → My father said that he ____ in Daegu. / 보기 lived, live, living / 아버지는 대구에 산다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | Mina said, "I am studying English." → Mina said that she ____ studying English. / 보기 was, is, am / 미나는 영어를 공부하고 있다고 말했다. | Mina said, "I am studying English." → Mina said that she ____ studying English. / 보기 was, be, am / 미나는 영어를 공부하고 있다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | My father said, "I have a cold." → My father said that he ____ a cold. / 보기 had, has, have / 아버지는 감기에 걸렸다고 말했다. | My father said, "I have a cold." → My father said that he ____ a cold. / 보기 had, having, have / 아버지는 감기에 걸렸다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | She said that she ____ cats. / 보기 liked, likes, like / 그녀는 고양이를 좋아한다고 말했다. | She said that she ____ cats. / 보기 liked, liking, like / 그녀는 고양이를 좋아한다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | Tom said, "I have a cold." → Tom said that he ____ a cold. / 보기 had, has, have / 톰은 감기에 걸렸다고 말했다. | Tom said, "I have a cold." → Tom said that he ____ a cold. / 보기 had, having, have / 톰은 감기에 걸렸다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | He said that he ____ finished. / 보기 had, has, have / 그는 끝냈다고 말했다. | He said that he ____ finished. / 보기 had, having, have / 그는 끝냈다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | Tom said, "I like this song." → Tom said that he ____ that song. / 보기 liked, likes, like / 톰은 이 노래를 좋아한다고 말했다. | Tom said, "I like this song." → Tom said that he ____ that song. / 보기 liked, liking, like / 톰은 이 노래를 좋아한다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | Mina said, "I am busy." → Mina said that she ____ busy. / 보기 was, is, am / 미나는 바쁘다고 말했다. | Mina said, "I am busy." → Mina said that she ____ busy. / 보기 was, be, am / 미나는 바쁘다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | Jisu said, "I have a cold." → Jisu said that she ____ a cold. / 보기 had, has, have / 지수는 감기에 걸렸다고 말했다. | Jisu said, "I have a cold." → Jisu said that she ____ a cold. / 보기 had, having, have / 지수는 감기에 걸렸다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | Mina said, "I want a new bike." → Mina said that she ____ a new bike. / 보기 wanted, wants, want / 미나는 새 자전거를 원한다고 말했다. | Mina said, "I want a new bike." → Mina said that she ____ a new bike. / 보기 wanted, wanting, want / 미나는 새 자전거를 원한다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | Tom said, "I am studying English." → Tom said that he ____ studying English. / 보기 was, is, am / 톰은 영어를 공부하고 있다고 말했다. | Tom said, "I am studying English." → Tom said that he ____ studying English. / 보기 was, be, am / 톰은 영어를 공부하고 있다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
| rs | My father said, "I am studying English." → My father said that he ____ studying English. / 보기 was, is, am / 아버지는 영어를 공부하고 있다고 말했다. | My father said, "I am studying English." → My father said that he ____ studying English. / 보기 was, be, am / 아버지는 영어를 공부하고 있다고 말했다. | 내용이 여전히 유효하면 가능한 시제 유지 형태를 단일 정답 문항의 보기에서 교체 |
