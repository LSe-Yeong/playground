package com.seyeong.playgroundback.game.repository;

import com.seyeong.playgroundback.game.domain.Game;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface GameRepository extends JpaRepository<Game, Long> {

    /** 카드 목록 (0-9). 태그를 한 번에 가져와 N+1 을 피한다. */
    @Query("""
            select distinct g
            from Game g
            left join fetch g.tags t
            order by g.sortOrder, t.sortOrder
            """)
    List<Game> findAllWithTagsOrderBySortOrder();
}
