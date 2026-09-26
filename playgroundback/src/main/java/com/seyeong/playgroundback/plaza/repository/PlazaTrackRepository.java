package com.seyeong.playgroundback.plaza.repository;

import com.seyeong.playgroundback.plaza.domain.PlazaTrack;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlazaTrackRepository extends JpaRepository<PlazaTrack, Long> {

    /** 목록 순서이자 다음 곡 순서다 (P-18). */
    List<PlazaTrack> findAllByOrderBySortOrderAsc();
}
