package cn.wilton.framework.file.modules.mapper;

import cn.wilton.framework.file.common.entity.ChatMessage;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.springframework.stereotype.Repository;

/**
 * <p>
 * @author Ranger
 * @email wilton.icp@gmail.com
 * @since 2021/4/25
 */
@Repository
public interface ChatMessageMapper extends BaseMapper<ChatMessage> {
}
