package com.seyeong.playgroundback.plaza.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.seyeong.playgroundback.global.config.ClockConfig;
import com.seyeong.playgroundback.global.config.JpaAuditingConfig;
import com.seyeong.playgroundback.plaza.domain.PlazaTrack;
import com.seyeong.playgroundback.plaza.fixture.PlazaFixture;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.context.annotation.Import;

@DataJpaTest
@Import({JpaAuditingConfig.class, ClockConfig.class})
class PlazaTrackRepositoryTest {

    @Autowired
    private PlazaTrackRepository plazaTrackRepository;

    @Autowired
    private TestEntityManager entityManager;

    @BeforeEach
    void clearSeedData() {
        entityManager.getEntityManager().createQuery("delete from PlazaTrack").executeUpdate();
    }

    @Test
    @DisplayName("곡 목록은 sort_order 순으로 가져온다")
    void findAllOrderBySortOrder() {
        // given - 다음 곡 순서가 이 정렬에 달려 있다 (P-18)
        entityManager.persist(PlazaFixture.track("epic", "웅장한 광장", 5));
        entityManager.persist(PlazaFixture.track("energetic", "신나는 하루", 0));
        entityManager.persist(PlazaFixture.track("calm", "잔잔한 오후", 1));
        entityManager.flush();

        // when & then
        assertThat(plazaTrackRepository.findAllByOrderBySortOrderAsc())
                .extracting(PlazaTrack::getCode)
                .containsExactly("energetic", "calm", "epic");
    }
}
