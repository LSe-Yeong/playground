package com.seyeong.playgroundback.game.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.seyeong.playgroundback.game.domain.Game;
import com.seyeong.playgroundback.game.domain.GameTag;
import com.seyeong.playgroundback.game.fixture.GameFixture;
import com.seyeong.playgroundback.global.config.ClockConfig;
import com.seyeong.playgroundback.global.config.JpaAuditingConfig;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.context.annotation.Import;

@DataJpaTest
@Import({JpaAuditingConfig.class, ClockConfig.class})
class GameRepositoryTest {

    @Autowired
    private GameRepository gameRepository;

    @Autowired
    private TestEntityManager entityManager;

    @BeforeEach
    void clearSeedData() {
        entityManager.getEntityManager().createQuery("delete from GameTag").executeUpdate();
        entityManager.getEntityManager().createQuery("delete from Game").executeUpdate();
    }

    @Test
    @DisplayName("카드 목록은 sort_order 순으로, 태그도 sort_order 순으로 가져온다")
    void findAllWithTagsOrderBySortOrder() {
        // given
        Game second = entityManager.persist(GameFixture.comingSoonGame("game2", 1));
        Game first = entityManager.persist(GameFixture.playableGame("onemore", 0));
        entityManager.persist(GameTag.builder().game(first).name("쉬운 규칙").sortOrder(2).build());
        entityManager.persist(GameTag.builder().game(first).name("주사위").sortOrder(0).build());
        entityManager.persist(GameTag.builder().game(first).name("운과 배짱").sortOrder(1).build());
        entityManager.flush();
        entityManager.clear();

        // when
        List<Game> games = gameRepository.findAllWithTagsOrderBySortOrder();

        // then
        assertThat(games).extracting(Game::getCode).containsExactly("onemore", "game2");
        assertThat(games.get(0).getTags()).extracting(GameTag::getName)
                .containsExactly("주사위", "운과 배짱", "쉬운 규칙");
        assertThat(games.get(1).getTags()).isEmpty();
        assertThat(second.getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("태그가 여러 개여도 카드는 한 번씩만 나온다")
    void findAllWithTagsWithoutDuplicates() {
        // given
        Game game = entityManager.persist(GameFixture.playableGame("onemore", 0));
        entityManager.persist(GameTag.builder().game(game).name("주사위").sortOrder(0).build());
        entityManager.persist(GameTag.builder().game(game).name("운과 배짱").sortOrder(1).build());
        entityManager.flush();
        entityManager.clear();

        // when
        List<Game> games = gameRepository.findAllWithTagsOrderBySortOrder();

        // then
        assertThat(games).hasSize(1);
    }
}
