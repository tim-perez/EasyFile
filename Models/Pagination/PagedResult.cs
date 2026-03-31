using System;
using System.Collections.Generic;

namespace EasyFile.Models.Pagination
{
    public class PagedResult<T>
    {
        public List<T> Items { get; set; } = new List<T>();
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        
        // Automatically calculates how many pages exist!
        public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    }
}