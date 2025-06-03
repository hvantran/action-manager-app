package com.hoatv.action.manager.dtos;

import java.util.List;

import org.springframework.data.domain.Page;

import lombok.Getter;

@Getter
public class PageResponseDTO<T> {
    private List<T> content;
    private int     page;
    private int     size;
    private long    totalElements;
    private int     totalPages;

    public PageResponseDTO (Page<T> page) {
        this.content = page.getContent();
        this.page = page.getNumber();
        this.size = page.getSize();
        this.totalElements = page.getTotalElements();
        this.totalPages = page.getTotalPages();
    }
}